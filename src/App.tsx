import { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import Onboarding       from './screens/Onboarding';
import Login            from './screens/Login';
import Dashboard        from './screens/Dashboard';
import Investigate      from './screens/Investigate';
import AnalysisProcess  from './screens/AnalysisProcess';
import CaseDetail       from './screens/CaseDetail';
import Alerts           from './screens/Alerts';
import Profile          from './screens/Profile';
import AIInvestigator   from './screens/AIInvestigator';
import EvidenceBundle   from './screens/EvidenceBundle';
import CrossCaseView    from './screens/CrossCaseView';
import SearchModal      from './components/SearchModal';
import DesktopNav       from './components/DesktopNav';
import { ToastStack }   from './components/Toast';
import type { ToastData, ToastType } from './components/Toast';
import { caseStore }     from './store/caseStore';
import { analysisStore, buildGraph } from './store/analysisStore';

type Screen =
  | 'ONBOARDING'
  | 'LOGIN'
  | 'DASHBOARD'
  | 'INVESTIGATE'
  | 'ANALYSIS'
  | 'CASE_DETAIL'
  | 'AI_INVESTIGATOR'
  | 'EVIDENCE_BUNDLE'
  | 'CROSS_CASE'
  | 'ALERTS'
  | 'PROFILE';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';
type NavDir = 'forward' | 'back' | 'tab';

export default function App() {
  // Session Persistence: check if user is already authenticated
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      const session = localStorage.getItem('vajra_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.email) {
          return 'DASHBOARD';
        }
      }
      const onboarded = localStorage.getItem('vajra_onboarded');
      if (onboarded === 'true') {
        return 'LOGIN';
      }
    } catch {}
    return 'ONBOARDING';
  });

  const [screenHistory, setScreenHistory] = useState<Screen[]>(['DASHBOARD']);
  const [prevScreen, setPrev]     = useState<Screen>('DASHBOARD');
  const [navDir, setNavDir]       = useState<NavDir>('forward');
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [caseId, setCaseId]       = useState('INV-2024-00128');
  const [wallet, setWallet]       = useState('');
  const [chain, setChain]         = useState('Ethereum');
  const [aiCaseId, setAiCaseId]   = useState('GENERAL');
  const [toasts, setToasts]       = useState<ToastData[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const lastBackPressRef = useRef<number>(0);
  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;
  const showSearchRef = useRef<boolean>(showSearch);
  showSearchRef.current = showSearch;

  /* ── Toast helpers ── */
  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    sub?: string,
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, sub }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Navigation ── */
  const go = (next: Screen, dir: NavDir = 'forward') => {
    setPrev(screenRef.current);
    setNavDir(dir);
    if (dir === 'forward') {
      setScreenHistory((prev) => [...prev, next]);
    }
    setScreen(next);
  };

  const navigateTab = (tab: Tab) => {
    setActiveTab(tab);
    setNavDir('tab');
    setPrev(screenRef.current);
    setScreen(tab as Screen);
  };

  const openCase = (id: string) => {
    setCaseId(id);
    const existing = caseStore.getById(id);
    if (existing) {
      setWallet(existing.wallet);
      setChain(existing.chain);

      let nodes = existing.graphNodes || [];
      let edges = existing.graphEdges || [];
      if ((!nodes || nodes.length <= 5) && existing.blockchain) {
        const built = buildGraph(existing.blockchain);
        if (built.nodes.length > 0) {
          nodes = built.nodes;
          edges = built.edges;
        }
      }

      analysisStore.set({
        caseId: existing.id,
        wallet: existing.wallet,
        blockchain: existing.blockchain,
        graphNodes: nodes,
        graphEdges: edges,
        aiNarrative: existing.aiNarrative || '',
        vaspAttribution: existing.vaspAttribution || [],
        evidence: existing.evidence || [],
        mlPrediction: existing.mlPrediction || null,
        riskDNA: existing.riskDNA || null,
        entityClusters: existing.entityClusters || [],
        fingerprint: existing.fingerprint || null,
        relationships: existing.relationships || [],
        typologyMatches: existing.typologyMatches || [],
        lifecycle: existing.lifecycle || null,
        dynamicPaths: existing.dynamicPaths || [],
        campaigns: existing.campaigns || [],
        predictions: existing.predictions || null,
        loading: false,
        error: '',
      });
    }
    go('CASE_DETAIL', 'forward');
  };

  const startAnalysis = (w: string, selectedChain: string, id: string) => {
    // Reset previous analysis state immediately to prevent stale graph showing during calculation
    analysisStore.reset();
    setWallet(w);
    setChain(selectedChain);
    setCaseId(id);
    go('ANALYSIS', 'forward');
    showToast('Analysis started', 'info', `Tracing ${w.slice(0, 10)}... on ${selectedChain}`);
  };

  const backToPrev = () => {
    if (screenRef.current === 'ANALYSIS' || screenRef.current === 'INVESTIGATE') {
      go('DASHBOARD', 'back');
      setActiveTab('DASHBOARD');
      return;
    }
    go(
      (['CASE_DETAIL', 'AI_INVESTIGATOR', 'EVIDENCE_BUNDLE', 'CROSS_CASE'].includes(prevScreen)
        ? prevScreen
        : activeTab as Screen) || 'DASHBOARD',
      'back',
    );
  };

  const backToCase = () => {
    go(prevScreen === 'DASHBOARD' ? 'DASHBOARD' : 'CASE_DETAIL', 'back');
  };

  const backFromCase = () => {
    go((activeTab as Screen) || 'DASHBOARD', 'back');
  };

  const logout = () => {
    try {
      localStorage.removeItem('vajra_session');
    } catch {}
    setScreen('LOGIN');
    setActiveTab('DASHBOARD');
    setNavDir('back');
    showToast('Signed out securely', 'success');
  };

  /* ── Hardware Back Button Handler (Capacitor & Web) ── */
  useEffect(() => {
    const handleHardwareBack = () => {
      // 1. If search modal is open, close it
      if (showSearchRef.current) {
        setShowSearch(false);
        return;
      }

      const current = screenRef.current;

      // 2. Sub-views that navigate back to Case Detail or Dashboard
      if (current === 'AI_INVESTIGATOR' || current === 'EVIDENCE_BUNDLE') {
        backToCase();
        return;
      }

      if (current === 'CASE_DETAIL' || current === 'CROSS_CASE' || current === 'ANALYSIS') {
        backFromCase();
        return;
      }

      // 3. Tab views that switch back to Dashboard
      if (current === 'INVESTIGATE' || current === 'ALERTS' || current === 'PROFILE') {
        navigateTab('DASHBOARD');
        return;
      }

      // 4. On Dashboard: Double press within 2s to exit, else show warning toast
      if (current === 'DASHBOARD') {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          showToast('Press back again to exit VAJRA', 'info', 'Session remains active');
        }
        return;
      }

      // 5. Onboarding / Login: prompt confirmation
      if (current === 'LOGIN' || current === 'ONBOARDING') {
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          showToast('Press back again to exit', 'info');
        }
      }
    };

    let backListener: any;
    try {
      backListener = CapacitorApp.addListener('backButton', handleHardwareBack);
    } catch {
      // Not on native device
    }

    // Also support browser popstate / back button
    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleHardwareBack();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  /* ── Global Keyboard Shortcuts (Cmd+K / Ctrl+K) ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ── Transition class ── */
  const transitionClass =
    navDir === 'forward' ? 'screen-forward' :
    navDir === 'back'    ? 'screen-back'    :
                           'screen-fade';

  const sharedToast = showToast;
  const isAuthScreen = screen === 'ONBOARDING' || screen === 'LOGIN';

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">

      {/* Toast layer */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Desktop Command Center Navigation (Hidden on Mobile) */}
      {!isAuthScreen && (
        <DesktopNav
          activeTab={activeTab}
          currentScreen={screen}
          onNavigate={(tab) => navigateTab(tab)}
          onOpenScreen={(s) => {
            if (s === 'AI_INVESTIGATOR') {
              setAiCaseId('GENERAL');
              go('AI_INVESTIGATOR', 'forward');
            } else {
              go(s as Screen, 'forward');
            }
          }}
          onOpenSearch={() => setShowSearch(true)}
          onLogout={logout}
          caseId={caseId}
          alertCount={3}
        />
      )}

      {/* Search modal overlay */}
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onOpenCase={(id) => { openCase(id); setShowSearch(false); }}
          onStartAnalysis={startAnalysis}
        />
      )}

      {/* Screen with key-based transition */}
      <div key={screen} className={`w-full flex-1 min-h-0 ${transitionClass}`}>

        {screen === 'ONBOARDING' && (
          <Onboarding onComplete={() => go('LOGIN', 'forward')} />
        )}

        {screen === 'LOGIN' && (
          <Login onLogin={() => {
            go('DASHBOARD', 'forward');
            setActiveTab('DASHBOARD');
            showToast('Welcome back, Rohit Sharma', 'success', 'Investigator · Cyber Cell, Unit 23');
          }} />
        )}

        {screen === 'DASHBOARD' && (
          <Dashboard
            onNavigate={navigateTab}
            onOpenCase={openCase}
            onOpenAI={() => {
              setAiCaseId('GENERAL');
              go('AI_INVESTIGATOR', 'forward');
            }}
            onNewInvestigation={() => { setActiveTab('INVESTIGATE'); navigateTab('INVESTIGATE'); }}
            onOpenSearch={() => setShowSearch(true)}
            onOpenCrossCase={() => go('CROSS_CASE', 'forward')}
            onStartAnalysis={startAnalysis}
            activeTab={activeTab}
            showToast={sharedToast}
          />
        )}

        {screen === 'INVESTIGATE' && (
          <Investigate
            onNavigate={navigateTab}
            onStartAnalysis={startAnalysis}
            onOpenCase={openCase}
            activeTab={activeTab}
          />
        )}

        {screen === 'ANALYSIS' && (
          <AnalysisProcess
            caseId={caseId}
            wallet={wallet}
            chain={chain}
            onComplete={() => go('CASE_DETAIL', 'forward')}
            onBack={backToPrev}
          />
        )}

        {screen === 'CASE_DETAIL' && (
          <CaseDetail
            caseId={caseId}
            onBack={backFromCase}
            onOpenAI={() => {
              setAiCaseId(caseId);
              go('AI_INVESTIGATOR', 'forward');
            }}
            onOpenEvidence={() => go('EVIDENCE_BUNDLE', 'forward')}
            showToast={sharedToast}
          />
        )}

        {screen === 'AI_INVESTIGATOR' && (
          <AIInvestigator
            caseId={aiCaseId}
            onBack={() => {
              if (aiCaseId && aiCaseId !== 'GENERAL' && prevScreen === 'CASE_DETAIL') {
                backToCase();
              } else {
                go((prevScreen === 'CASE_DETAIL' ? 'CASE_DETAIL' : 'DASHBOARD'), 'back');
              }
            }}
          />
        )}

        {screen === 'EVIDENCE_BUNDLE' && (
          <EvidenceBundle
            caseId={caseId}
            onBack={backToCase}
          />
        )}

        {screen === 'CROSS_CASE' && (
          <CrossCaseView
            onBack={backToPrev}
            onOpenCase={openCase}
          />
        )}

        {screen === 'ALERTS' && (
          <Alerts
            onNavigate={navigateTab}
            onOpenCase={openCase}
            activeTab={activeTab}
          />
        )}

        {screen === 'PROFILE' && (
          <Profile
            onNavigate={navigateTab}
            onLogout={logout}
            activeTab={activeTab}
          />
        )}

      </div>
    </div>
  );
}
