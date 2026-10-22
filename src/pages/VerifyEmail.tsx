
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { confirmEmail, resendCode } = useAuth();

    const [email, setEmail] = useState(
        (location.state as { email?: string } | null)?.email || ''
    );
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const result = await confirmEmail(email, code);

            if (result.success) {
                navigate('/login', {
                    replace: true,
                    state: { message: 'Email verified! Please sign in.' },
                });
            } else {
                setError(result.error || 'Verification failed.');
            }
        } catch {
            setError('Unable to verify your email right now.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await resendCode(email);

            if (result.success) {
                setMessage('A new verification code has been sent.');
            } else {
                setError(result.error || 'Unable to resend code.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-ambient-orb auth-orb-1" />
            <div className="auth-ambient-orb auth-orb-2" />

            <div className="auth-card glass-panel animate-fade-in">
                <div className="auth-header">
                    <div className="logo-icon auth-logo">
                        <MailCheck size={28} />
                    </div>

                    <h1 className="auth-title">Verify Your Email</h1>

                    <p className="auth-subtitle">
                        Enter the verification code sent to your email
                        to activate your student account.
                    </p>
                </div>

                {error && (
                    <div className="auth-error-banner" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <p role="status" style={{ color: 'var(--success)' }}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleVerify} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="verify-email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="verify-email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="verification-code" className="form-label">
                            Verification Code
                        </label>
                        <input
                            id="verification-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="form-input"
                            placeholder="Enter your verification code"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-primary-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>

                    <button
                        type="button"
                        className="auth-primary-btn"
                        onClick={handleResend}
                        disabled={isLoading}
                    >
                        Resend Verification Code
                    </button>
                </form>

                <div className="auth-footer">
                    <ShieldCheck size={16} />
                    <p>Your account is protected by Amazon Cognito.</p>
                    <Link to="/login" className="auth-link">
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};
