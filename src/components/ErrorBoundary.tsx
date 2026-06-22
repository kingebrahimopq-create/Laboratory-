import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if ((this.state as State).hasError) {
      const err = (this.state as State).error;
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
          background:'#f8fafc', fontFamily:'Tajawal,sans-serif', direction:'rtl', padding:'2rem' }}>
          <div style={{ maxWidth:'480px', background:'#fff', border:'1px solid #e2e8f0',
            borderRadius:'16px', padding:'2rem', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⚠️</div>
            <h2 style={{ color:'#0f766e', fontSize:'1.2rem', marginBottom:'0.75rem', fontWeight:700 }}>
              حدث خطأ غير متوقع
            </h2>
            <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'1.5rem', lineHeight:1.6 }}>
              {err?.message ?? 'خطأ مجهول'}
            </p>
            <button onClick={() => window.location.reload()}
              style={{ background:'#0f766e', color:'#fff', border:'none', borderRadius:'10px',
                padding:'0.6rem 1.5rem', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}>
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }
    return (this.props as Props).children;
  }
}
