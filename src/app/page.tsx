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

  // Removed toggle - logging is always on when ready

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
      changeIndex: change.changeIndex,
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
          <h1>Keystroke Analytics</h1>
          <p className={styles.subtitle}>Real-time document activity tracking</p>
        </div>

        {/* Office.js Status */}
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <h2>Connection Status</h2>
            {isReady && isLogging && (
              <span className={styles.activeBadge}>Active</span>
            )}
          </div>
          {isLoading && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.loading}></span>
              <span>Initializing connection...</span>
            </div>
          )}
          {error && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.error}></span>
              <span>{error}</span>
            </div>
          )}
          {isReady && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.ready}></span>
              <span>Connected to Word document</span>
            </div>
          )}
          {!isLoading && !isReady && !error && (
            <div className={styles.status}>
              <span className={styles.statusDot + ' ' + styles.notReady}></span>
              <span>Awaiting Word context</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actionsCard}>
          <div className={styles.actions}>
            <button 
              onClick={handleDownloadJSON}
              disabled={!isReady || changes.length === 0}
              className={styles.downloadButton}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 11L4 7H6V3H10V7H12L8 11Z" fill="currentColor"/>
                <path d="M3 13H13V15H3V13Z" fill="currentColor"/>
              </svg>
              Export Data
            </button>
            <button 
              onClick={handleClearChanges}
              disabled={!isReady || changes.length === 0}
              className={styles.clearButton}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 2V1H11V2H14V4H2V2H5ZM3 5H13V14C13 14.5523 12.5523 15 12 15H4C3.44772 15 3 14.5523 3 14V5Z" fill="currentColor"/>
              </svg>
              Clear Data
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className={styles.statsCard}>
          <h2>Analytics Overview</h2>
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
          <h2>Activity Log</h2>
          <p className={styles.subtitle}>Last 10 detected changes</p>
          {changes.length === 0 ? (
            <p className={styles.noChanges}>Awaiting document activity</p>
          ) : (
            <div className={styles.changesList}>
              {changes.slice(-10).reverse().map((change, index) => (
                <div key={index} className={styles.changeItem}>
                  <div className={styles.changeHeader}>
                    <div className={styles.changeTypeWrapper}>
                      <span className={styles.changeType + ' ' + styles[change.changeType]}>
                        {change.changeType}
                      </span>
                      <span className={styles.changeTime}>
                        {new Date(change.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className={styles.cpsValue}>{change.cps.toFixed(1)} CPS</span>
                  </div>
                  <div className={styles.changeDetails}>
                    <span>{change.changeLength} characters at index {change.changeIndex}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isWordContext && (
          <div className={styles.instructionsCard}>
            <h2>Setup Required</h2>
            <p className={styles.instructionText}>
              This application must be loaded as a Word Add-in to function. 
              Upload the manifest.xml file via Insert → Add-ins → Upload My Add-in in Microsoft Word.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
