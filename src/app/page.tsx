'use client'

import { useState, useEffect } from 'react'
import { useOfficeJs } from '../hooks/useOfficeJs'
import styles from './page.module.css'

export default function Home() {
  const { 
    isReady, 
    isLoading,
    error,
    isWordContext,
    isLogging, 
    changes, 
    startLogging, 
    stopLogging,
    getStats,
    clearChanges 
  } = useOfficeJs()

  const [stats, setStats] = useState({
    totalChanges: 0,
    additions: 0,
    deletions: 0,
    modifications: 0,
    avgCPS: 0,
    maxCPS: 0,
    currentCPS: 0,
    totalCharsChanged: 0
  })

  // Update stats every 2 seconds when logging
  useEffect(() => {
    if (isLogging) {
      const interval = setInterval(() => {
        setStats(getStats())
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isLogging, getStats])

  // Auto-start logging when ready
  useEffect(() => {
    if (isReady && !isLogging) {
      const started = startLogging()
      if (started) {
        console.log('Auto-started keylogging')
      }
    }
  }, [isReady, isLogging, startLogging])

  const handleToggleLogging = () => {
    if (isLogging) {
      stopLogging()
    } else {
      startLogging()
    }
  }

  const handleClearChanges = () => {
    clearChanges()
    setStats(getStats())
  }

  const handleDownloadJSON = () => {
    // Get all changes
    const allChanges = changes.map(change => ({
      timestamp: change.timestamp,
      changeType: change.changeType,
      changeLength: change.changeLength,
      changePosition: change.changePosition,
      cps: change.cps,
      previousText: change.previousText,
      currentText: change.currentText
    }))

    // Create download data with stats
    const downloadData = {
      exportDate: new Date().toISOString(),
      statistics: stats,
      totalChangesRecorded: allChanges.length,
      changes: allChanges
    }

    // Convert to JSON
    const jsonString = JSON.stringify(downloadData, null, 2)
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `keylogger-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1>📝 Office.js KeyLogger MVP</h1>
          <p className={styles.subtitle}>Minimal keystroke tracking for Word documents</p>
        </div>

        {/* Office.js Status */}
        <div className={styles.statusCard}>
          <h2>🔌 Office.js Status</h2>
          {isLoading && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.loading}></span>
              <span>Loading Office.js...</span>
            </div>
          )}
          {error && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.error}></span>
              <span>Error: {error}</span>
            </div>
          )}
          {isReady && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.ready}></span>
              <span>Ready - Word Context Detected</span>
            </div>
          )}
          {!isLoading && !isReady && !error && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.notReady}></span>
              <span>Not in Word context</span>
            </div>
          )}
        </div>

        {/* Logging Controls */}
        <div className={styles.controlsCard}>
          <h2>🎮 Controls</h2>
          <div className={styles.controls}>
            <button 
              onClick={handleToggleLogging}
              disabled={!isReady}
              className={isLogging ? styles.stopButton : styles.startButton}
            >
              {isLogging ? '⏸️ Stop Logging' : '▶️ Start Logging'}
            </button>
            <button 
              onClick={handleDownloadJSON}
              disabled={!isReady || changes.length === 0}
              className={styles.downloadButton}
            >
              💾 Download JSON
            </button>
            <button 
              onClick={handleClearChanges}
              disabled={!isReady || changes.length === 0}
              className={styles.clearButton}
            >
              🗑️ Clear Changes
            </button>
          </div>
          <div className={styles.loggingStatus}>
            {isLogging ? (
              <span className={styles.activeStatus}>🟢 Logging Active</span>
            ) : (
              <span className={styles.inactiveStatus}>🔴 Logging Stopped</span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className={styles.statsCard}>
          <h2>📊 Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Changes</div>
              <div className={styles.statValue}>{stats.totalChanges}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Additions</div>
              <div className={styles.statValue}>{stats.additions}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Deletions</div>
              <div className={styles.statValue}>{stats.deletions}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Modifications</div>
              <div className={styles.statValue}>{stats.modifications}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Avg CPS</div>
              <div className={styles.statValue}>{stats.avgCPS.toFixed(2)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Max CPS</div>
              <div className={styles.statValue}>{stats.maxCPS.toFixed(2)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Current CPS</div>
              <div className={styles.statValue}>{stats.currentCPS.toFixed(2)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Total Chars</div>
              <div className={styles.statValue}>{stats.totalCharsChanged}</div>
            </div>
          </div>
        </div>

        {/* Recent Changes */}
        <div className={styles.changesCard}>
          <h2>📜 Recent Changes (Last 10)</h2>
          {changes.length === 0 ? (
            <p className={styles.noChanges}>No changes recorded yet. Start typing in your Word document!</p>
          ) : (
            <div className={styles.changesList}>
              {changes.slice(-10).reverse().map((change, index) => (
                <div key={index} className={styles.changeItem}>
                  <div className={styles.changeHeader}>
                    <span className={styles.changeType + ' ' + styles[change.changeType]}>
                      {change.changeType === 'addition' && '➕'}
                      {change.changeType === 'deletion' && '➖'}
                      {change.changeType === 'modification' && '✏️'}
                      {' '}{change.changeType}
                    </span>
                    <span className={styles.changeTime}>
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.changeDetails}>
                    <span>Length: {change.changeLength} chars</span>
                    <span>Position: {change.changePosition}</span>
                    <span>CPS: {change.cps.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isWordContext && (
          <div className={styles.instructionsCard}>
            <h2>ℹ️ How to Use</h2>
            <ol className={styles.instructions}>
              <li>This is an Office.js Word Add-in</li>
              <li>To test it, you need to load it in Microsoft Word (Online or Desktop)</li>
              <li>Follow the Office Add-in documentation to sideload this app</li>
              <li>Once loaded in Word, keylogging will start automatically</li>
            </ol>
          </div>
        )}
      </main>
    </div>
  )
}
