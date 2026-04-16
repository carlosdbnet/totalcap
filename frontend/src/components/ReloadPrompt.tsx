import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X, Download } from 'lucide-react'
import './ReloadPrompt.css'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="pwa-toast-container">
      {(offlineReady || needRefresh) && (
        <div className="glass-panel pwa-toast">
          <div className="pwa-message">
            {offlineReady ? (
              <>
                <div className="pwa-icon-box success">
                  <Download size={20} />
                </div>
                <div className="pwa-text">
                  <span className="pwa-title">Pronto para Offline</span>
                  <p>O Totalcap agora funciona sem internet.</p>
                </div>
              </>
            ) : (
              <>
                <div className="pwa-icon-box update">
                  <RefreshCw size={20} className="animate-spin-slow" />
                </div>
                <div className="pwa-text">
                  <span className="pwa-title">Atualização Disponível</span>
                  <p>Uma nova versão do Totalcap está disponível.</p>
                </div>
              </>
            )}
          </div>
          <div className="pwa-actions">
            {needRefresh && (
              <button className="btn-pwa-update" onClick={() => updateServiceWorker(true)}>
                Atualizar Agora
              </button>
            )}
            <button className="btn-pwa-close" onClick={() => close()}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReloadPrompt
