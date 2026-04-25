import React, { useState } from 'react';

const USLogin = ({ onLoginSuccess }) => {
  const { handleGoogleLogin: syncAuth } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  const googleClientId = "544220144669-dm29cjddvbb0e3tgh0gom57me9rha79b.apps.googleusercontent.com";

  const handleLoginClick = () => {
    if (!window.google) {
      setError("Google SDK not loaded. Please check your internet connection.");
      return;
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: "openid profile email",
      ux_mode: "popup", // Using popup here for the web page itself
      select_account: true,
      callback: async (response) => {
        if (response.error) {
          setError(`Login failed: ${response.error}`);
          return;
        }

        try {
          setIsLoggingIn(true);
          // Send code to backend
          const res = await fetch("https://us-ide-backend.onrender.com/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              code: response.code,
              web_redirect_uri: "postmessage" // Required for popup flow
            })
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Backend authentication failed" }));
            throw new Error(errorData.error || errorData.details || "Backend authentication failed");
          }
          const data = await res.json();

          if (data.user && data.token) {
            // Success! Redirect to deep link
            const deepLink = `uside://auth?token=${data.token}&user=${encodeURIComponent(JSON.stringify(data.user))}`;
            window.location.href = deepLink;
            
            // Fallback: show success message if deep link doesn't trigger
            setTimeout(() => {
              setIsLoggingIn(false);
              document.body.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0a0f;color:#fff;font-family:sans-serif;">
                  <h2 style="color:#7c6df5;">Login Successful!</h2>
                  <p>You can close this window and return to US IDE.</p>
                  <button onclick="window.close()" style="padding:10px 20px;background:#7c6df5;border:none;border-radius:5px;color:#fff;cursor:pointer;">Close Window</button>
                </div>
              `;
            }, 2000);
          }
        } catch (err) {
          setError(err.message);
          setIsLoggingIn(false);
        }
      }
    });

    client.requestCode();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0f',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: 400,
        padding: '40px',
        background: '#161625',
        borderRadius: '16px',
        border: '1px solid #1a1a28',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 300, marginBottom: '8px' }}>US IDE Login</h2>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px' }}>
          Sign in to access your AI-powered cloud IDE.
        </p>

        {error && (
          <div style={{ 
            background: 'rgba(255, 77, 109, 0.1)', 
            color: '#ff4d6d', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '13px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 77, 109, 0.2)'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLoginClick}
          disabled={isLoggingIn}
          style={{
            width: '100%',
            height: 48,
            background: isLoggingIn ? '#252541' : '#fff',
            border: 'none',
            borderRadius: 24,
            color: '#000',
            fontSize: '15px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: isLoggingIn ? 'default' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isLoggingIn ? (
            <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.558c-.411.275-.937.438-1.548.438-1.192 0-2.201-.806-2.561-1.89H4.978v2.342C6.459 17.398 8.169 18 9 18z" fill="#34A853"/>
                <path d="M6.439 12.106c-.095-.285-.149-.589-.149-.906s.054-.621.149-.906V7.952H4.978C4.542 8.832 4.3 9.8 4.3 10.8s.242 1.968.678 2.848l1.461-1.542z" fill="#FBBC05"/>
                <path d="M9 4.3c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.806 11.426 0 9 0 6.169 0 4.459.602 3.511 1.611l2.927 2.341C6.799 5.106 7.808 4.3 9 4.3z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default USLogin;
