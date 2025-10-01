interface DocumentChange {
  timestamp: Date;
  previousText: string;
  currentText: string;
  changeType: 'addition' | 'deletion' | 'modification';
  changeLength: number;
  changeIndex: number;
  cps: number; // Characters per second
}

class KeyLogger {
  private isLogging: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastDocumentText: string = '';
  private changes: DocumentChange[] = [];
  private readonly MAX_CHANGES = 50;
  private readonly MIN_POLLING_INTERVAL = 1000; // 1 second minimum between polls
  private lastDataTimestamp: Date | null = null;
  private isPolling: boolean = false;

  /**
   * Start logging document changes
   */
  start(): void {
    if (this.isLogging) {
      return;
    }

    this.detectPlatform();
    this.isLogging = true;
    this.isPolling = false;

    // Initialize the baseline document text and start polling
    this.initializeDocumentText().then(() => {
      this.scheduleNextPoll();
    });
  }

  /**
   * Detect if we're running in Word Online vs Word Desktop
   */
  private detectPlatform(): void {
    try {
      // Check if we're in a browser environment (Word Online)
      const isWordOnline = typeof window !== 'undefined' &&
        window.location &&
        (window.location.hostname.includes('office.com') ||
          window.location.hostname.includes('sharepoint.com') ||
          window.location.hostname.includes('outlook.com'));

      console.log(`🔍 Platform detected: ${isWordOnline ? 'Word Online' : 'Word Desktop'}`);
    } catch {
      // console.warn('Could not detect platform, defaulting to Word Desktop');
    }
  }

  /**
   * Initialize the baseline document text
   */
  private async initializeDocumentText(): Promise<void> {
    try {
      const initialText = await this.getDocumentText();
      this.lastDocumentText = initialText;
      this.lastDataTimestamp = new Date(); // Set initial data timestamp
    } catch {
      this.lastDocumentText = '';
      this.lastDataTimestamp = new Date(); // Set timestamp even on error
    }
  }

  /**
   * Stop logging document changes
   */
  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isLogging = false;
    this.isPolling = false;
    this.lastDataTimestamp = null;
  }

  /**
   * Schedule the next polling request after minimum interval
   */
  private scheduleNextPoll(): void {
    if (!this.isLogging) {
      return;
    }

    const now = new Date();
    const timeSinceLastData = this.lastDataTimestamp
      ? now.getTime() - this.lastDataTimestamp.getTime()
      : this.MIN_POLLING_INTERVAL;

    // Ensure minimum interval between polls
    const delay = Math.max(0, this.MIN_POLLING_INTERVAL - timeSinceLastData);

    this.timeoutId = setTimeout(() => {
      if (this.isLogging && !this.isPolling) {
        this.pollDocumentChange();
      }
    }, delay);
  }

  /**
   * Poll for document changes (dynamic polling)
   */
  private async pollDocumentChange(): Promise<void> {
    if (this.isPolling || !this.isLogging) {
      return;
    }

    this.isPolling = true;

    try {
      if (!window.Office || !Office.context || !Office.context.document) {
        this.isPolling = false;
        this.scheduleNextPoll();
        return;
      }

      // Get current document text
      const currentText = await this.getDocumentText();

      // Record when we received this data
      const dataTimestamp = new Date();

      if (currentText !== this.lastDocumentText) {
        // Calculate change using timestamps from actual data packets
        const change = this.calculateChangeWithDataTimestamps(
          this.lastDocumentText,
          currentText,
          this.lastDataTimestamp,
          dataTimestamp
        );

        this.addChange(change);
        this.lastDocumentText = currentText;
      }

      // Update last data timestamp regardless of whether text changed
      this.lastDataTimestamp = dataTimestamp;

    } catch (error) {
      console.error('Error polling document change:', error);
    } finally {
      this.isPolling = false;
      this.scheduleNextPoll();
    }
  }

  /**
   * Get the entire document text using Office.js
   */
  private async getDocumentText(): Promise<string> {
    try {
      if (!Office.context.document) {
        throw new Error('Document context not available');
      }

      // Only use Word.run to get body text - no selection methods
      return await this.getBodyText();
    } catch (error) {
      console.error('Failed to get document text:', error);
      return ''; // Return empty string if we can't get text
    }
  }

  /**
   * Get document body text using Word.run with fallback for Word Online compatibility
   */
  private getBodyText(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Try Word.run first (works on both Desktop and Online)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Word.run(async (context: any) => {
          try {
            const body = context.document.body;
            body.load('text');
            await context.sync();
            const text = body.text || '';
            // console.log(`📄 Retrieved document text via Word.run: ${text.length} chars`);
            resolve(text);
          } catch {
            // console.warn('Word.run failed, trying fallback method');
            // Fallback: try to get text using Office.context.document
            this.getTextFallback().then(resolve).catch(reject);
          }
        }).catch(() => {
          // console.warn('Word.run initialization failed, trying fallback');
          // Fallback: try to get text using Office.context.document
          this.getTextFallback().then(resolve).catch(reject);
        });
      } catch {
        // console.warn('Word.run setup failed, trying fallback');
        this.getTextFallback().then(resolve).catch(reject);
      }
    });
  }

  /**
   * Fallback method to get document text using Office.context.document
   * This works better in Word Online in some cases
   */
  private getTextFallback(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!Office.context || !Office.context.document) {
          reject(new Error('Office.context.document not available'));
          return;
        }

        // Try to get the entire document content
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Office.context.document.getFileAsync(Office.FileType.Text, (result: any) => {
          if (result.status === Office.AsyncResultStatus.Succeeded) {
            const file = result.value;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            file.getSliceAsync(0, (sliceResult: any) => {
              if (sliceResult.status === Office.AsyncResultStatus.Succeeded) {
                const data = sliceResult.value.data;
                const text = new TextDecoder().decode(data);
                // console.log(`📄 Retrieved document text via fallback: ${text.length} chars`);
                resolve(text);
              } else {
                console.error('Failed to get file slice:', sliceResult.error);
                reject(new Error('Could not retrieve document text via fallback'));
              }
            });
          } else {
            console.error('Failed to get file:', result.error);
            // Last resort: try getSelectedDataAsync with empty selection
            this.getTextLastResort().then(resolve).catch(reject);
          }
        });
      } catch (error) {
        console.error('Fallback method failed:', error);
        this.getTextLastResort().then(resolve).catch(reject);
      }
    });
  }

  /**
   * Last resort method to get document text
   */
  private getTextLastResort(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (!Office.context || !Office.context.document) {
          reject(new Error('Office.context.document not available'));
          return;
        }

        // Try to select all and get the text
        Office.context.document.getSelectedDataAsync(
          Office.CoercionType.Text,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (result: any) => {
            if (result.status === Office.AsyncResultStatus.Succeeded) {
              const text = result.value as string || '';
              // console.log(`Retrieved document text via last resort: ${text.length} chars`);
              resolve(text);
            } else {
              console.error('Last resort method failed:', result.error);
              resolve(''); // Return empty string rather than failing completely
            }
          }
        );
      } catch (error) {
        console.error('Last resort method failed:', error);
        resolve(''); // Return empty string rather than failing completely
      }
    });
  }


  /**
   * Calculate the difference between two text versions using data packet timestamps
   */
  private calculateChangeWithDataTimestamps(
    previousText: string,
    currentText: string,
    previousDataTimestamp: Date | null,
    currentDataTimestamp: Date
  ): DocumentChange {
    let changeType: 'addition' | 'deletion' | 'modification' = 'modification';
    let changeIndex = 0;
    let changeLength = 0;

    // Simple diff calculation
    if (currentText.length > previousText.length) {
      changeType = 'addition';
      changeLength = currentText.length - previousText.length;
      changeIndex = this.findChangePosition(previousText, currentText);
    } else if (currentText.length < previousText.length) {
      changeType = 'deletion';
      changeLength = previousText.length - currentText.length;
      changeIndex = this.findChangePosition(currentText, previousText);
    } else {
      changeType = 'modification';
      changeLength = this.countDifferences(previousText, currentText);
      changeIndex = this.findFirstDifference(previousText, currentText);
    }

    // Calculate CPS based on time between data packets
    const cps = this.calculateCPSFromDataTimestamps(
      changeLength,
      previousDataTimestamp,
      currentDataTimestamp
    );

    return {
      timestamp: currentDataTimestamp,
      previousText,
      currentText,
      changeType,
      changeLength,
      changeIndex,
      cps
    };
  }

  /**
   * Find the position where text change occurred
   */
  private findChangePosition(shorterText: string, longerText: string): number {
    for (let i = 0; i < shorterText.length; i++) {
      if (shorterText[i] !== longerText[i]) {
        return i;
      }
    }
    return shorterText.length; // Change at the end
  }

  /**
   * Find the first position where two texts differ
   */
  private findFirstDifference(text1: string, text2: string): number {
    const minLength = Math.min(text1.length, text2.length);
    for (let i = 0; i < minLength; i++) {
      if (text1[i] !== text2[i]) {
        return i;
      }
    }
    return minLength;
  }

  /**
   * Count the number of character differences between two texts
   */
  private countDifferences(text1: string, text2: string): number {
    const maxLength = Math.max(text1.length, text2.length);
    let differences = 0;

    for (let i = 0; i < maxLength; i++) {
      if ((text1[i] || '') !== (text2[i] || '')) {
        differences++;
      }
    }

    return differences;
  }

  /**
   * Calculate Characters Per Second (CPS) based on data packet timestamps
   */
  private calculateCPSFromDataTimestamps(
    changeLength: number,
    previousDataTimestamp: Date | null,
    currentDataTimestamp: Date
  ): number {
    if (!previousDataTimestamp || changeLength === 0) {
      return 0;
    }

    // Calculate time difference between when we received the data packets
    const timeDiffMs = currentDataTimestamp.getTime() - previousDataTimestamp.getTime();
    const timeDiffSeconds = timeDiffMs / 1000;

    // Avoid division by zero and very small time differences
    if (timeDiffSeconds <= 0.1) {
      return 0;
    }

    return changeLength / timeDiffSeconds;
  }

  /**
   * Add a change to the changes array, maintaining max size
   */
  private addChange(change: DocumentChange): void {
    this.changes.push(change);

    // Keep only the last 50 changes
    if (this.changes.length > this.MAX_CHANGES) {
      this.changes = this.changes.slice(-this.MAX_CHANGES);
    }
  }

  /**
   * Get the current changes array
   */
  getChanges(): DocumentChange[] {
    return [...this.changes]; // Return a copy
  }

  /**
   * Get the last N changes
   */
  getLastChanges(count: number): DocumentChange[] {
    return this.changes.slice(-count);
  }

  /**
   * Clear all recorded changes
   */
  clearChanges(): void {
    this.changes = [];
    // console.log('KeyLogger changes clearedd');
  }

  /**
   * Get logging status
   */
  isActive(): boolean {
    return this.isLogging;
  }

  /**
   * Get the current document text (public method)
   */
  async getCurrentDocumentText(): Promise<string> {
    try {
      return await this.getDocumentText();
    } catch (error) {
      console.error('Failed to get current document text:', error);
      return 'Unable to access document content.';
    }
  }

  /**
   * Get statistics about recorded changes
   */
  getStats() {
    const totalChanges = this.changes.length;
    const additions = this.changes.filter(c => c.changeType === 'addition').length;
    const deletions = this.changes.filter(c => c.changeType === 'deletion').length;
    const modifications = this.changes.filter(c => c.changeType === 'modification').length;

    // Calculate CPS statistics
    const cpsValues = this.changes.map(c => c.cps).filter(cps => cps > 0);
    const avgCPS = cpsValues.length > 0 ? cpsValues.reduce((sum, cps) => sum + cps, 0) / cpsValues.length : 0;
    const maxCPS = cpsValues.length > 0 ? Math.max(...cpsValues) : 0;

    // Calculate total characters changed
    const totalCharsChanged = this.changes.reduce((sum, c) => sum + c.changeLength, 0);

    // Get current CPS (from last 5 changes)
    const recentChanges = this.changes.slice(-5);
    const recentCpsValues = recentChanges.map(c => c.cps).filter(cps => cps > 0);
    const currentCPS = recentCpsValues.length > 0 ? recentCpsValues[recentCpsValues.length - 1] : 0;

    return {
      totalChanges,
      additions,
      deletions,
      modifications,
      isLogging: this.isLogging,
      avgCPS: parseFloat(avgCPS.toFixed(2)),
      maxCPS: parseFloat(maxCPS.toFixed(2)),
      currentCPS: parseFloat(currentCPS.toFixed(2)),
      totalCharsChanged
    };
  }

  /**
   * Get detailed CPS information for the last N changes
   */
  getCPSHistory(count: number = 10): Array<{ timestamp: Date, cps: number, changeType: string }> {
    return this.changes.slice(-count).map(change => ({
      timestamp: change.timestamp,
      cps: change.cps,
      changeType: change.changeType
    }));
  }

  /**
   * Manual test method to add a fake change for testing
   * Call this from browser console: keyLogger.addTestChange()
   */
  addTestChange(): void {
    const testChange: DocumentChange = {
      timestamp: new Date(),
      previousText: 'Test previous text',
      currentText: 'Test current text with more content',
      changeType: 'addition',
      changeLength: 25,
      changeIndex: 0,
      cps: 5.0
    };

    this.addChange(testChange);
    // console.log('🧪 Added test change. Total changes:', this.changes.length);
  }

  /**
   * Debug method to check keylogger status
   * Call this from browser console: keyLogger.debugStatus()
   */
  debugStatus(): void {
    // console.log('🔍 KeyLogger Debug Status:');
    // console.log('- Is logging:', this.isLogging);
    // console.log('- Total changes:', this.changes.length);
    // console.log('- Last document text length:', this.lastDocumentText.length);
    // console.log('- Platform: Word');
    // console.log('- Office available:', typeof window.Office !== 'undefined');
    // console.log('- Context available:', !!(window.Office && Office.context));
    // console.log('- Document available:', !!(window.Office && Office.context && Office.context.document));

    if (this.changes.length > 0) {
      // console.log('- Recent changes:', this.changes.slice(-3));
    } else {
      // console.log('- No changes recorded yet');
    }
  }
}

// Export singleton instance
export const keyLogger = new KeyLogger();
export type { DocumentChange };

