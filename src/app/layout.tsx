'use client'

import { useEffect } from 'react'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

declare global {
  interface Window {
    Office: any;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // In Word Online, Office.js should already be available
    const checkOfficeAvailability = () => {
      if (typeof window !== 'undefined' && window.Office) {
        console.log('Office.js is available')
        if (window.Office.onReady) {
          window.Office.onReady(() => {
            console.log('Office.js is ready and initialized')
          })
        }
      } else {
        console.log('Office.js not found - checking if we need to load it')
        
        // Only try to load Office.js if we're not in Word Online
        const isWordOnline = window.location.hostname.includes('office.com') || 
                            window.location.hostname.includes('sharepoint.com')
        
        if (!isWordOnline) {
          const script = document.createElement('script')
          script.src = 'https://appsforoffice.microsoft.com/lib/1/hosted/office.js'
          script.async = true
          document.head.appendChild(script)
          
          script.onload = () => {
            console.log('Office.js loaded successfully')
          }
          
          script.onerror = () => {
            console.warn('Failed to load Office.js - running in standalone mode')
          }
        } else {
          console.warn('In Word Online but Office.js not detected')
        }
      }
    }

    // Check immediately and also after a short delay
    checkOfficeAvailability()
    const timer = setTimeout(checkOfficeAvailability, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
