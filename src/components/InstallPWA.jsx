import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone;
    
    if (isIOSDevice && !isInStandaloneMode) {
      setIsIOS(true);
      setShowInstallButton(true);
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked!', {
      isIOS,
      deferredPrompt,
      showIOSInstructions
    });

    if (isIOS) {
      console.log('iOS detected, showing instructions modal');
      // Show iOS instructions
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      console.log('No deferredPrompt available');
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n1. Open browser menu\n2. Look for "Install" or "Add to Home Screen"\n3. Follow the prompts');
      return;
    }

    try {
      console.log('Showing install prompt...');
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      console.log('User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Error during install:', error);
    }
  };

  // Debug: Always show for now
  console.log('InstallPWA Debug:', {
    isInstalled,
    showInstallButton,
    isIOS,
    userAgent: navigator.userAgent,
    standalone: window.navigator.standalone,
    displayMode: window.matchMedia('(display-mode: standalone)').matches
  });

  // Don't show anything if app is already installed or install not available
  // Temporarily comment out to debug
  // if (isInstalled || !showInstallButton) {
  //   return null;
  // }

  return (
    <>
      {/* Install Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 100,
          background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '25px',
          boxShadow: '0 4px 20px rgba(46, 125, 50, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          animation: 'slideInUp 0.5s ease-out'
        }}
        onClick={handleInstallClick}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 25px rgba(46, 125, 50, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 20px rgba(46, 125, 50, 0.3)';
        }}
      >
        <span style={{ fontSize: '16px' }}>📱</span>
        <span>{isIOS ? 'Add to Home' : 'Install App'}</span>
        <span style={{ fontSize: '10px', marginLeft: '5px' }}>
          {isInstalled ? '✓' : showInstallButton ? '●' : '○'}
        </span>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '350px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#2E7D32', marginBottom: '20px' }}>
              Install Hajki App
            </h3>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              To install this app on your iPhone:
            </p>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                1. Tap the <strong>Share</strong> button <span style={{ fontSize: '18px' }}>⬆️</span>
              </p>
              <p style={{ marginBottom: '10px' }}>
                2. Scroll down and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: '18px' }}>📱</span>
              </p>
              <p>
                3. Tap <strong>"Add"</strong> to confirm
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          div {
            bottom: 80px !important;
            right: 10px !important;
            font-size: 12px !important;
            padding: 10px 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          div {
            bottom: 90px !important;
            right: 5px !important;
            left: 5px !important;
            width: auto !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </>
  );
};

export default InstallPWA;
