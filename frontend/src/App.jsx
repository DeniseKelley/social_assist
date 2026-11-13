import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  MessageSquare,
  BarChart3,
  Sparkles,
  Plus,
  Send,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Zap,
  KeyRound,
  Trash2,
  Play,
  ArrowUpRight,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Bookmark,
  Eye,
  EyeOff,
  MessageCircle,
  LogIn,
  UserPlus,
  LogOut,
  Calendar,
} from 'lucide-react';
import PlannerCalendar from './PlannerCalendar';
import {
  TechFairyCharacter,
  PlugMechanicCharacter,
} from './CartoonCharacters';
import {
  INITIAL_AUTOMATIONS,
  INITIAL_ANALYTICS,
  EMPTY_WORKSPACE_ANALYTICS,
  GENERIC_US_BENCHMARK_ACTIVITY,
  runLocalOpenClawAnalysis,
} from './fallbackEngine';
import {
  PLATFORMS,
  PLATFORM_BY_ID,
  PlatformIcon,
  extractHandleForPlatform,
  explainInvalidHandleInput,
  buildCombinedPlatformAnalytics,
} from './platforms';
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  peekOAuthIntent,
  setOAuthIntent,
  clearOAuthIntent,
} from './supabase';
import PoliciesModal from './PoliciesModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'planner' | 'automations' | 'strategy' | 'connect'
  const [selectedPlatform, setSelectedPlatform] = useState('all'); // 'all' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'threads'
  const [connectPlatform, setConnectPlatform] = useState('instagram'); // 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'x' | 'threads'
  const [connectionsMap, setConnectionsMap] = useState({});
  const [analyticsByPlatform, setAnalyticsByPlatform] = useState({});
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCastingWand, setIsCastingWand] = useState(false);

  // Strict Sign-Up-Required Multi-Account Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [signupUsername, setSignupUsername] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');
  const [policiesModal, setPoliciesModal] = useState({ open: false, section: 'terms' });
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const verifiedUserIdsRef = useRef(new Set());
  const signingOutGuardRef = useRef(false);

  // Connect form & 1-Click OAuth state
  const [handleInput, setHandleInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [connectStatusMsg, setConnectStatusMsg] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [oauthProviders, setOauthProviders] = useState({});
  const [oauthRedirectUri, setOauthRedirectUri] = useState('');

  // New Automation Drawer state
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    platform: 'all',
    trigger_type: 'comment_keyword',
    keywords: 'LINK, GUIDE',
    public_comment_reply: 'Just sent it to your DMs! Check your message requests ✨🧚‍♀️',
    dm_message: 'Hey! 👋 Thanks for commenting! Tap the button below to grab the resource:',
    dm_button_text: 'Open Resource ✨',
    dm_button_url: 'https://example.com',
  });

  // Live Simulator state
  const [simType, setSimType] = useState('comment');
  const [simUser, setSimUser] = useState('sarah_builds');
  const [simText, setSimText] = useState('Wait this is awesome!! Can you send me the LINK please?');
  const [simResult, setSimResult] = useState(null);

  // Video Performance Ranking & OpenClaw Agent Hookup state
  const [videoSortBy, setVideoSortBy] = useState('views'); // 'views' | 'likes' | 'comments' | 'engagement' | 'recent' | 'followers'
  const [openclawGatewayUrl, setOpenclawGatewayUrl] = useState(
    'http://localhost:18789/v1/chat/completions'
  );
  const [openclawPrompt, setOpenclawPrompt] = useState(
    'Analyze my top-performing live posts & videos across my connected platforms and write 3 new high-converting scripts optimized for peak US scroll windows.'
  );
  const [openclawOutput, setOpenclawOutput] = useState(() =>
    runLocalOpenClawAnalysis(
      'Analyze my top-performing live posts & videos across my connected platforms and write 3 new high-converting scripts optimized for peak US scroll windows.',
      INITIAL_ANALYTICS
    )
  );
  const [openclawStatus, setOpenclawStatus] = useState('ready'); // 'ready' | 'running' | 'connected_gateway' | 'builtin_agent'
  const [showBriefPreview, setShowBriefPreview] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const triggerFairyWand = () => {
    setIsCastingWand(true);
    setTimeout(() => setIsCastingWand(false), 750);
  };

  const getActiveAnalyticsSnapshot = (overrideMap, overrideConns, overridePlatform) => {
    const aMap = overrideMap || analyticsByPlatform;
    const cMap = overrideConns || connectionsMap;
    const plat = overridePlatform || selectedPlatform;
    if (plat === 'all') {
      return (
        buildCombinedPlatformAnalytics(aMap, cMap, GENERIC_US_BENCHMARK_ACTIVITY) ||
        EMPTY_WORKSPACE_ANALYTICS
      );
    }
    return aMap[plat] || EMPTY_WORKSPACE_ANALYTICS;
  };

  const handleRunOpenClaw = async (customPromptText) => {
    const promptToUse = customPromptText || openclawPrompt;
    if (customPromptText) {
      setOpenclawPrompt(customPromptText);
    }
    setOpenclawStatus('running');
    triggerFairyWand();
    const activeSnapshot = getActiveAnalyticsSnapshot();
    try {
      const res = await fetch('/api/openclaw/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          gateway_url: openclawGatewayUrl,
          platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
          handle:
            selectedPlatform !== 'all'
              ? connectionsMap[selectedPlatform]?.handle
              : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpenclawOutput(data.agent_response);
        setOpenclawStatus(
          data.status === 'connected_openclaw_gateway' ? 'connected_gateway' : 'builtin_agent'
        );
        showToast('OpenClaw Agent finished analyzing your live stats!');
        return;
      }
      throw new Error('Fallback to local OpenClaw analyzer');
    } catch {
      const fallbackText = runLocalOpenClawAnalysis(promptToUse, activeSnapshot);
      setOpenclawOutput(fallbackText);
      setOpenclawStatus('builtin_agent');
      showToast('OpenClaw Agent finished analyzing your live stats!');
    }
  };

  const getWorkspaceScope = (emailOverride) => {
    const raw = (
      emailOverride ??
      currentUserEmail ??
      sessionStorage.getItem('sa_user_email') ??
      ''
    )
      .trim()
      .toLowerCase();
    return raw || 'guest';
  };

  const scopedKey = (base, emailOverride) => `${base}_v2:${getWorkspaceScope(emailOverride)}`;

  const loadSavedConnectionsMap = (emailOverride) => {
    let rawMap = {};
    try {
      rawMap =
        JSON.parse(localStorage.getItem(scopedKey('sa_connections_map', emailOverride)) || '{}') || {};
    } catch {
      rawMap = {};
    }
    const map = {};
    let mutated = false;
    for (const [platId, entry] of Object.entries(rawMap)) {
      if (!entry || typeof entry !== 'object') {
        mutated = true;
        continue;
      }
      const cleaned = extractHandleForPlatform(entry.handle || '');
      if (!cleaned || /^https?:\/\//i.test(cleaned)) {
        mutated = true;
        continue;
      }
      if (cleaned !== entry.handle) {
        mutated = true;
      }
      map[platId] = { ...entry, handle: cleaned };
    }

    // Seamless migration from single-platform `sa_connection` if present for this user
    if (!map.instagram) {
      try {
        const legacyIg = JSON.parse(
          localStorage.getItem(scopedKey('sa_connection', emailOverride)) || 'null'
        );
        if (legacyIg?.instagram_handle) {
          const cleanIg = extractHandleForPlatform(legacyIg.instagram_handle);
          if (cleanIg && !/^https?:\/\//i.test(cleanIg)) {
            map.instagram = {
              handle: cleanIg,
              has_access_token: Boolean(legacyIg.has_access_token),
              connected_at: new Date().toISOString(),
            };
            mutated = true;
          }
        }
      } catch {
        // ignore
      }
    }

    if (mutated) {
      localStorage.setItem(scopedKey('sa_connections_map', emailOverride), JSON.stringify(map));
    }
    return map;
  };

  const loadSavedTokensMap = (emailOverride) => {
    let tMap = {};
    try {
      tMap = JSON.parse(localStorage.getItem(scopedKey('sa_tokens_map', emailOverride)) || '{}') || {};
    } catch {
      tMap = {};
    }
    const legacyIgToken = localStorage.getItem(scopedKey('sa_ig_access_token', emailOverride)) || '';
    if (legacyIgToken && !tMap.instagram) {
      tMap.instagram = legacyIgToken;
      localStorage.setItem(scopedKey('sa_tokens_map', emailOverride), JSON.stringify(tMap));
    }
    return tMap;
  };

  const fetchPlatformAnalytics = async ({
    platformId,
    overrideHandle = '',
    forceRefresh = false,
    emailOverride,
  }) => {
    const cMap = loadSavedConnectionsMap(emailOverride);
    const tMap = loadSavedTokensMap(emailOverride);
    const targetHandle = extractHandleForPlatform(
      overrideHandle || cMap[platformId]?.handle || ''
    );
    const savedToken = tMap[platformId] || '';

    if (!targetHandle && !savedToken) {
      return null;
    }

    const headers = {};
    if (savedToken) {
      headers.Authorization = `Bearer ${savedToken}`;
    }

    const buildUrl = (refreshFlag) => {
      const qs = new URLSearchParams({
        platform: platformId,
        handle: targetHandle,
      });
      if (refreshFlag) {
        qs.set('refresh', 'true');
      }
      return `/api/analytics?${qs.toString()}`;
    };

    let resp = await fetch(buildUrl(forceRefresh), {
      headers,
      cache: forceRefresh ? 'no-store' : 'default',
    });

    // Automatic retry once on transient 502/503/504 upstream gateway hiccups
    if (resp.status >= 500) {
      await new Promise((r) => setTimeout(r, 900));
      resp = await fetch(buildUrl(true), {
        headers,
        cache: 'no-store',
      });
    }

    if (!resp.ok) {
      const errJson = await resp.json().catch(() => ({}));
      const baseMsg =
        errJson.error ||
        `${PLATFORM_BY_ID[platformId]?.name || platformId} returned HTTP ${resp.status}`;
      const fullMsg =
        errJson.detail && !baseMsg.includes(errJson.detail)
          ? `${baseMsg} — ${errJson.detail}`
          : baseMsg;
      throw new Error(fullMsg);
    }
    const data = await resp.json();
    setAnalyticsByPlatform((prev) => {
      const next = { ...prev, [platformId]: data };
      setOpenclawOutput((prevOut) => {
        if (openclawStatus !== 'ready') return prevOut;
        const snap = getActiveAnalyticsSnapshot(next, cMap);
        return runLocalOpenClawAnalysis(openclawPrompt, snap);
      });
      return next;
    });
    return data;
  };

  const fetchAll = async (emailOverride) => {
    // Purge legacy un-scoped cache keys so every user starts with a clean isolated workspace
    localStorage.removeItem('sa_analytics');
    localStorage.removeItem('sa_analytics_v4_real');
    localStorage.removeItem('sa_analytics_v5_live');
    localStorage.removeItem('sa_connection');
    localStorage.removeItem('sa_ig_access_token');

    const cMap = loadSavedConnectionsMap(emailOverride);
    const rawFlows = localStorage.getItem(scopedKey('sa_automations', emailOverride));
    const savedFlows = JSON.parse(rawFlows || 'null') || INITIAL_AUTOMATIONS;
    const savedLogs = JSON.parse(
      localStorage.getItem(scopedKey('sa_logs', emailOverride)) || '[]'
    );

    setConnectionsMap(cMap);
    setAutomations(savedFlows);
    setLogs(savedLogs);

    const connectedIdsInitial = PLATFORMS.map((p) => p.id).filter((pid) => cMap[pid]?.handle);
    const initialConnectPlat = connectedIdsInitial[0] || 'instagram';
    setConnectPlatform(initialConnectPlat);
    const initHandle = cMap[initialConnectPlat]?.handle || '';
    setHandleInput(
      initHandle ? PLATFORM_BY_ID[initialConnectPlat].buildProfileUrl(initHandle) : ''
    );

    if (connectedIdsInitial.length === 0) {
      setSelectedPlatform('instagram');
      setActiveTab('connect');
      setAnalyticsByPlatform({});
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, EMPTY_WORKSPACE_ANALYTICS));
      setLoading(false);
      return;
    }

    // Auto-link Threads through connected Instagram account unless user explicitly disconnected Threads
    const shouldAutoLinkThreads =
      Boolean(cMap.instagram?.handle) &&
      !cMap.threads?.handle &&
      !localStorage.getItem(scopedKey('sa_threads_auto_optout', emailOverride));

    const fetchTargets = [...connectedIdsInitial];
    if (shouldAutoLinkThreads && !fetchTargets.includes('threads')) {
      fetchTargets.push('threads');
    }

    setSelectedPlatform(connectedIdsInitial.length > 1 ? 'all' : connectedIdsInitial[0]);

    try {
      const results = await Promise.all(
        fetchTargets.map(async (pid) => {
          try {
            const handleForPid =
              pid === 'threads' && shouldAutoLinkThreads
                ? cMap.instagram.handle
                : cMap[pid]?.handle;
            const res = await fetchPlatformAnalytics({
              platformId: pid,
              overrideHandle: handleForPid,
              forceRefresh: false,
              emailOverride,
            });
            return [pid, res];
          } catch {
            return [pid, null];
          }
        })
      );
      const nextAnalytics = {};
      let updatedConns = { ...cMap };
      for (const [pid, res] of results) {
        if (res) {
          nextAnalytics[pid] = res;
          if (pid === 'threads' && shouldAutoLinkThreads && res.profile?.username) {
            updatedConns = {
              ...updatedConns,
              threads: {
                handle: res.profile.username,
                has_access_token: false,
                linked_via: 'instagram',
                connected_at: new Date().toISOString(),
              },
            };
            localStorage.setItem(
              scopedKey('sa_connections_map', emailOverride),
              JSON.stringify(updatedConns)
            );
            setConnectionsMap(updatedConns);
          }
        }
      }
      setAnalyticsByPlatform(nextAnalytics);
      const finalConnectedIds = PLATFORMS.map((p) => p.id).filter(
        (pid) => updatedConns[pid]?.handle
      );
      const nextSelected = finalConnectedIds.length > 1 ? 'all' : finalConnectedIds[0];
      setSelectedPlatform(nextSelected);
      const snap = getActiveAnalyticsSnapshot(nextAnalytics, updatedConns, nextSelected);
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, snap));
    } finally {
      setLoading(false);
    }
  };

  const hasCompletedSignUp = (user) => {
    if (!user) return false;
    if (verifiedUserIdsRef.current.has(user.id)) return true;
    if (user.user_metadata?.sa_registered === true) return true;
    if (Array.isArray(user.identities) && user.identities.some((id) => id.provider === 'email')) {
      return true;
    }
    return false;
  };

  const cleanAuthUrlParams = () => {
    if (typeof window === 'undefined') return;
    const hasAuthParams =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error=') ||
      window.location.search.includes('auth_intent=');
    if (hasAuthParams) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.origin}${window.location.pathname}`
      );
    }
  };

  useEffect(() => {
    // Check if OAuth returned an explicit error/cancellation in URL
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthErr =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');
      if (oauthErr) {
        clearOAuthIntent();
        cleanAuthUrlParams();
        setLoginError(
          oauthErr.includes('access_denied')
            ? 'Google authentication was cancelled.'
            : decodeURIComponent(oauthErr.replace(/\+/g, ' '))
        );
      }
    } catch {
      // ignore URL parse issues
    }

    const safetyTimer = setTimeout(() => {
      setAuthChecking(false);
    }, 4000);

    // Auto-refresh live platform numbers every 90 seconds while authenticated & visible
    const livePollTimer = setInterval(() => {
      const activeEmail = sessionStorage.getItem('sa_user_email') || '';
      if (document.visibilityState === 'visible' && activeEmail) {
        const savedMap = loadSavedConnectionsMap(activeEmail);
        for (const p of PLATFORMS) {
          if (savedMap[p.id]?.handle) {
            fetchPlatformAnalytics({
              platformId: p.id,
              overrideHandle: savedMap[p.id].handle,
              forceRefresh: true,
              emailOverride: activeEmail,
            }).catch(() => {});
          }
        }
      }
    }, 90000);

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore re-entrant sign-out events triggered by our own unregistered-user rejection
      if (signingOutGuardRef.current) {
        if (!session?.user) {
          signingOutGuardRef.current = false;
          setIsAuthenticated(false);
          setAuthChecking(false);
        }
        return;
      }

      const intent = peekOAuthIntent();
      cleanAuthUrlParams();

      if (!session?.user) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          clearOAuthIntent();
        }
        sessionStorage.removeItem('sa_user_email');
        setCurrentUserEmail('');
        setCurrentUsername('');
        setIsAuthenticated(false);
        setAuthChecking(false);
        return;
      }

      const user = session.user;
      const email = (user.email || '').toLowerCase();
      const resolvedName =
        user.user_metadata?.username || user.user_metadata?.full_name || user.user_metadata?.name || '';

      // 0. Password Recovery Link Callback -> Let user choose a new password
      if (event === 'PASSWORD_RECOVERY' || intent === 'recovery') {
        clearOAuthIntent();
        setAuthMode('signin');
        setResetMode(false);
        setRecoveryMode(true);
        setIsAuthenticated(false);
        setAuthChecking(false);
        setLoginInfo(`Enter a new password for ${email}.`);
        return;
      }

      // 1. Explicit Sign-Up flow (Google Sign Up or Email Sign Up confirmation link)
      if (intent === 'signup') {
        const alreadyRegistered = user.user_metadata?.sa_registered === true;
        const nowIso = new Date().toISOString();
        verifiedUserIdsRef.current.add(user.id);
        clearOAuthIntent();
        sessionStorage.setItem('sa_user_email', email);
        setCurrentUserEmail(email);
        setCurrentUsername(resolvedName);
        setLoginError('');
        setLoginInfo('');
        setIsAuthenticated(true);
        setAuthChecking(false);
        fetchAll(email);

        if (!alreadyRegistered) {
          supabase.auth
            .updateUser({
              data: {
                sa_registered: true,
                sa_registered_at: nowIso,
                accepted_terms: true,
                accepted_terms_date: nowIso,
              },
            })
            .catch(() => {});
          showToast(`Account created! Welcome, ${resolvedName || email}`);
        } else {
          showToast(`Logged in as ${resolvedName || email}`);
        }
        return;
      }

      // 2. Sign-In or Session Reload — STRICTLY require prior Sign Up!
      if (!hasCompletedSignUp(user)) {
        clearOAuthIntent();
        signingOutGuardRef.current = true;
        sessionStorage.removeItem('sa_user_email');
        setCurrentUserEmail('');
        setCurrentUsername('');
        setIsAuthenticated(false);
        if (intent === 'signin') {
          setAuthMode('signup');
          setLoginInfo('');
          setLoginError(
            `No account found for ${email || 'that Google account'}. Only users who have signed up can log in — please agree to the Terms & Privacy Policy and sign up below first!`
          );
        }
        await supabase.auth.signOut().catch(() => {});
        signingOutGuardRef.current = false;
        setAuthChecking(false);
        return;
      }

      // 3. Verified Registered Account -> Log in to their isolated workspace
      verifiedUserIdsRef.current.add(user.id);
      clearOAuthIntent();
      if (user.user_metadata?.sa_registered !== true) {
        supabase.auth
          .updateUser({
            data: {
              sa_registered: true,
              sa_registered_at: new Date().toISOString(),
            },
          })
          .catch(() => {});
      }
      sessionStorage.setItem('sa_user_email', email);
      setCurrentUserEmail(email);
      setCurrentUsername(resolvedName);
      setLoginError('');
      setIsAuthenticated(true);
      setAuthChecking(false);
      fetchAll(email);
    });

    fetch('/api/oauth?action=providers')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.providers) setOauthProviders(d.providers);
        if (d?.redirect_uri) setOauthRedirectUri(d.redirect_uri);
      })
      .catch(() => {});

    const handleOAuthMessage = async (event) => {
      if (!event?.data) return;
      if (event.data.type === 'SA_OAUTH_ERROR') {
        const errText = event.data.error || '1-Click authorization was cancelled.';
        setConnectStatusMsg({ type: 'error', text: errText });
        showToast(errText, 'error');
        return;
      }
      if (event.data.type === 'SA_OAUTH_SUCCESS') {
        const { platform, access_token, account_id, handle } = event.data;
        const emailScope = sessionStorage.getItem('sa_user_email') || '';
        const meta = PLATFORM_BY_ID[platform] || PLATFORM_BY_ID.instagram;
        const cleanTok = String(access_token || '').trim();
        const cleanHandle =
          extractHandleForPlatform(handle || '') || String(handle || '').replace(/^@/, '') || 'creator';
        const cleanAccId = String(account_id || '').trim();

        const cMap = loadSavedConnectionsMap(emailScope);
        const tMap = loadSavedTokensMap(emailScope);

        if (cleanTok) {
          tMap[meta.id] = cleanTok;
          localStorage.setItem(scopedKey('sa_tokens_map', emailScope), JSON.stringify(tMap));
          if (meta.id === 'instagram') {
            localStorage.setItem(scopedKey('sa_ig_access_token', emailScope), cleanTok);
          }

          let plannerToks = {};
          try {
            plannerToks =
              JSON.parse(localStorage.getItem(scopedKey('sa_platform_tokens', emailScope)) || '{}') ||
              {};
          } catch {
            plannerToks = {};
          }
          plannerToks[meta.id] = {
            ...(plannerToks[meta.id] || {}),
            access_token: cleanTok,
            account_id: cleanAccId,
          };
          localStorage.setItem(
            scopedKey('sa_platform_tokens', emailScope),
            JSON.stringify(plannerToks)
          );

          // Sync token to RLS-isolated Supabase row so 24/7 scheduled posts auto-publish!
          supabase.auth
            .getUser()
            .then(({ data }) => {
              const uid = data?.user?.id;
              if (uid) {
                supabase
                  .from('user_platform_tokens')
                  .upsert(
                    {
                      user_id: uid,
                      tokens: plannerToks,
                      updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' }
                  )
                  .catch(() => {});
              }
            })
            .catch(() => {});
        }

        let nextConns = {
          ...cMap,
          [meta.id]: {
            handle: cleanHandle,
            has_access_token: Boolean(cleanTok),
            account_id: cleanAccId,
            oauth_connected: true,
            connected_at: new Date().toISOString(),
          },
        };
        localStorage.setItem(scopedKey('sa_connections_map', emailScope), JSON.stringify(nextConns));
        if (meta.id === 'instagram') {
          localStorage.setItem(
            scopedKey('sa_connection', emailScope),
            JSON.stringify({
              instagram_handle: cleanHandle,
              has_access_token: Boolean(cleanTok),
              account_id: cleanAccId,
            })
          );
        }

        setConnectionsMap(nextConns);
        setHandleInput(meta.buildProfileUrl(cleanHandle));
        setSelectedPlatform(meta.id);
        setConnectStatusMsg({
          type: 'success',
          text: `⚡ 1-Click Connected @${cleanHandle} (${meta.name}) — Live Analytics & Auto-Publishing Ready!`,
        });
        showToast(`⚡ Connected @${cleanHandle} (${meta.name}) with 1-Click Auto-Publishing!`);
        triggerFairyWand();
        fetchPlatformAnalytics({
          platformId: meta.id,
          overrideHandle: cleanHandle,
          forceRefresh: true,
          emailOverride: emailScope,
        }).catch(() => {});
        return;
      }
      if (event.data.type === 'IG_OAUTH_SUCCESS') {
        showToast('Connected Instagram via OAuth!');
        fetchAll(sessionStorage.getItem('sa_user_email') || '');
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => {
      clearTimeout(safetyTimer);
      clearInterval(livePollTimer);
      window.removeEventListener('message', handleOAuthMessage);
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  const handleSelectConnectPlatform = (platId) => {
    const meta = PLATFORM_BY_ID[platId] || PLATFORM_BY_ID.instagram;
    setConnectPlatform(meta.id);
    setConnectStatusMsg(null);
    setTokenInput('');
    const existingHandle =
      connectionsMap[meta.id]?.handle ||
      (meta.id === 'threads' ? connectionsMap.instagram?.handle || '' : '');
    setHandleInput(existingHandle ? meta.buildProfileUrl(existingHandle) : '');
  };

  const tryAutoLinkThreadsForInstagramHandle = async (igHandle, baseConnsMap) => {
    if (!igHandle) return { conns: baseConnsMap, threadsAnalytics: null };
    if (baseConnsMap.threads?.handle && baseConnsMap.threads?.linked_via !== 'instagram') {
      return { conns: baseConnsMap, threadsAnalytics: null };
    }
    try {
      const thAna = await fetchPlatformAnalytics({
        platformId: 'threads',
        overrideHandle: igHandle,
        forceRefresh: true,
      });
      if (thAna?.profile?.username) {
        localStorage.removeItem(scopedKey('sa_threads_auto_optout'));
        const updated = {
          ...baseConnsMap,
          threads: {
            handle: thAna.profile.username,
            has_access_token: false,
            linked_via: 'instagram',
            connected_at: new Date().toISOString(),
          },
        };
        localStorage.setItem(scopedKey('sa_connections_map'), JSON.stringify(updated));
        return { conns: updated, threadsAnalytics: thAna };
      }
    } catch {
      // Optional auto-link if creator also has a public Threads profile
    }
    return { conns: baseConnsMap, threadsAnalytics: null };
  };

  const handleAutoConnectThreadsFromInstagram = async () => {
    const igHandle = connectionsMap.instagram?.handle;
    if (!igHandle) return;
    setSyncing(true);
    setConnectStatusMsg(null);
    try {
      localStorage.removeItem(scopedKey('sa_threads_auto_optout'));
      const cMap = loadSavedConnectionsMap();
      const thAna = await fetchPlatformAnalytics({
        platformId: 'threads',
        overrideHandle: igHandle,
        forceRefresh: true,
      });
      const resolvedHandle = thAna?.profile?.username || igHandle;
      const nextConns = {
        ...cMap,
        threads: {
          handle: resolvedHandle,
          has_access_token: false,
          linked_via: 'instagram',
          connected_at: new Date().toISOString(),
        },
      };
      localStorage.setItem(scopedKey('sa_connections_map'), JSON.stringify(nextConns));
      setConnectionsMap(nextConns);
      setHandleInput(PLATFORM_BY_ID.threads.buildProfileUrl(resolvedHandle));
      setSelectedPlatform('threads');
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, thAna || EMPTY_WORKSPACE_ANALYTICS));
      setConnectStatusMsg({
        type: 'success',
        text: `Auto-connected Threads (@${resolvedHandle}) through your Instagram account!`,
      });
      showToast(`Connected Threads (@${resolvedHandle}) via Instagram!`);
      setActiveTab('analytics');
      triggerFairyWand();
    } catch (err) {
      setConnectStatusMsg({ type: 'error', text: err.message });
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleOneClickOAuthConnect = (platId = connectPlatform) => {
    const meta = PLATFORM_BY_ID[platId] || PLATFORM_BY_ID.instagram;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const oauthUrl = `/api/oauth?action=start&platform=${encodeURIComponent(meta.id)}&origin=${encodeURIComponent(origin)}`;
    window.open(oauthUrl, `${meta.id}_oauth_window`, 'width=620,height=740');
  };

  const handleConnectAndRedirect = async (e) => {
    if (e) e.preventDefault();
    const meta = PLATFORM_BY_ID[connectPlatform] || PLATFORM_BY_ID.instagram;
    const extracted = extractHandleForPlatform(handleInput);

    // If 1-Click OAuth is configured on the server and no handle was typed, launch OAuth directly!
    if (!extracted && oauthProviders[meta.id]) {
      handleOneClickOAuthConnect(meta.id);
      return;
    }

    if (!extracted) {
      const invalidMsg = explainInvalidHandleInput(handleInput, meta.name);
      setConnectStatusMsg({
        type: 'error',
        text: invalidMsg,
      });
      showToast(invalidMsg, 'error');
      return;
    }

    // Open 1-Click OAuth popup if configured on server, otherwise open platform sign-in window
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const targetUrl = oauthProviders[meta.id]
      ? `/api/oauth?action=start&platform=${encodeURIComponent(meta.id)}&origin=${encodeURIComponent(origin)}`
      : meta.buildLoginUrl(extracted);
    const popupWin = window.open(targetUrl, `${meta.id}_login_window`, 'width=620,height=740');

    // Re-sync live stats automatically once the user returns from logging into the platform window
    const onReturnFocus = () => {
      window.removeEventListener('focus', onReturnFocus);
      const savedMap = loadSavedConnectionsMap();
      const handleToSync = savedMap[meta.id]?.handle || extracted;
      if (handleToSync) {
        fetchPlatformAnalytics({
          platformId: meta.id,
          overrideHandle: handleToSync,
          forceRefresh: true,
        }).catch(() => {});
      }
    };
    if (popupWin) {
      setTimeout(() => {
        window.addEventListener('focus', onReturnFocus, { once: true });
      }, 1500);
    }

    await handleConnectSubmit(null, extracted);
  };

  const handleConnectSubmit = async (e, overrideHandle) => {
    if (e) e.preventDefault();
    const meta = PLATFORM_BY_ID[connectPlatform] || PLATFORM_BY_ID.instagram;
    const cleanHandle = overrideHandle || extractHandleForPlatform(handleInput);
    if (!cleanHandle && !(tokenInput && tokenInput.trim())) {
      const invalidMsg = explainInvalidHandleInput(handleInput, meta.name);
      setConnectStatusMsg({
        type: 'error',
        text: invalidMsg,
      });
      return;
    }
    setSyncing(true);
    setConnectStatusMsg(null);
    try {
      const cMap = loadSavedConnectionsMap();
      const tMap = loadSavedTokensMap();

      if (tokenInput && tokenInput.trim()) {
        const cleanToken = tokenInput.trim();
        const verifyResp = await fetch(
          `/api/analytics?platform=${encodeURIComponent(meta.id)}&handle=${encodeURIComponent(cleanHandle || 'me')}&refresh=true&strict_token=true`,
          {
            headers: { Authorization: `Bearer ${cleanToken}` },
            cache: 'no-store',
          }
        );
        if (!verifyResp.ok) {
          const errJson = await verifyResp.json().catch(() => ({}));
          throw new Error(errJson.error || `Invalid ${meta.name} API token`);
        }
        const liveAna = await verifyResp.json();
        const finalHandle = liveAna.profile?.username || cleanHandle;

        const nextTokens = { ...tMap, [meta.id]: cleanToken };
        localStorage.setItem(scopedKey('sa_tokens_map'), JSON.stringify(nextTokens));
        if (meta.id === 'instagram') {
          localStorage.setItem(scopedKey('sa_ig_access_token'), cleanToken);
        }

        // Also mirror into Planner & Supabase `user_platform_tokens` for 24/7 auto-publishing
        let plannerToks = {};
        try {
          plannerToks =
            JSON.parse(localStorage.getItem(scopedKey('sa_platform_tokens')) || '{}') || {};
        } catch {
          plannerToks = {};
        }
        plannerToks[meta.id] = {
          ...(plannerToks[meta.id] || {}),
          access_token: cleanToken,
          account_id: liveAna.profile?.account_id || '',
        };
        localStorage.setItem(scopedKey('sa_platform_tokens'), JSON.stringify(plannerToks));
        supabase.auth
          .getUser()
          .then(({ data }) => {
            if (data?.user?.id) {
              supabase
                .from('user_platform_tokens')
                .upsert(
                  {
                    user_id: data.user.id,
                    tokens: plannerToks,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: 'user_id' }
                )
                .catch(() => {});
            }
          })
          .catch(() => {});

        let nextConns = {
          ...cMap,
          [meta.id]: {
            handle: finalHandle,
            has_access_token: true,
            account_id: liveAna.profile?.account_id || '',
            connected_at: new Date().toISOString(),
          },
        };
        localStorage.setItem(scopedKey('sa_connections_map'), JSON.stringify(nextConns));
        if (meta.id === 'instagram') {
          localStorage.setItem(
            scopedKey('sa_connection'),
            JSON.stringify({
              instagram_handle: finalHandle,
              has_access_token: true,
              account_id: liveAna.profile?.account_id || '',
            })
          );
          const autoThreads = await tryAutoLinkThreadsForInstagramHandle(finalHandle, nextConns);
          nextConns = autoThreads.conns;
        }

        setConnectionsMap(nextConns);
        setHandleInput(meta.buildProfileUrl(finalHandle));
        setAnalyticsByPlatform((prev) => {
          const next = { ...prev, [meta.id]: liveAna };
          const snap = getActiveAnalyticsSnapshot(next, nextConns, meta.id);
          setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, snap));
          return next;
        });
        setSelectedPlatform(meta.id);
        setConnectStatusMsg({
          type: 'success',
          text: `Connected @${finalHandle} on ${meta.name} via Official API (live metrics synced)!`,
        });
        showToast(`Connected @${finalHandle} on ${meta.name}!`);
        setTokenInput('');
        setActiveTab('analytics');
        triggerFairyWand();
      } else {
        // Verify & pull live stats FIRST before persisting handle to workspace storage
        const liveAna = await fetchPlatformAnalytics({
          platformId: meta.id,
          overrideHandle: cleanHandle,
          forceRefresh: true,
        });
        const resolvedHandle = liveAna?.profile?.username || cleanHandle;

        if (meta.id === 'threads') {
          localStorage.removeItem(scopedKey('sa_threads_auto_optout'));
        }

        let nextConns = {
          ...cMap,
          [meta.id]: {
            handle: resolvedHandle,
            has_access_token: Boolean(tMap[meta.id]),
            connected_at: new Date().toISOString(),
          },
        };
        localStorage.setItem(scopedKey('sa_connections_map'), JSON.stringify(nextConns));
        if (meta.id === 'instagram') {
          localStorage.setItem(
            scopedKey('sa_connection'),
            JSON.stringify({
              instagram_handle: resolvedHandle,
              has_access_token: Boolean(tMap.instagram),
            })
          );
          const autoThreads = await tryAutoLinkThreadsForInstagramHandle(resolvedHandle, nextConns);
          nextConns = autoThreads.conns;
        }
        setConnectionsMap(nextConns);
        setHandleInput(meta.buildProfileUrl(resolvedHandle));
        setSelectedPlatform(meta.id);
        setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, liveAna || EMPTY_WORKSPACE_ANALYTICS));
        const threadsAutoLinked =
          meta.id === 'instagram' && nextConns.threads?.linked_via === 'instagram';
        setConnectStatusMsg({
          type: 'success',
          text: threadsAutoLinked
            ? `Redirected to Instagram & synced live stats for @${resolvedHandle} (+ auto-connected Threads)!`
            : `Redirected to ${meta.name} & synced live stats for @${resolvedHandle}!`,
        });
        showToast(
          threadsAutoLinked
            ? `Connected Instagram & auto-linked Threads for @${resolvedHandle}!`
            : `Connected ${meta.name} & pulled live stats for @${resolvedHandle}!`
        );
        setActiveTab('analytics');
        triggerFairyWand();
      }
    } catch (innerErr) {
      setConnectStatusMsg({ type: 'error', text: innerErr.message });
      showToast(innerErr.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectPlatform = (platId = connectPlatform) => {
    const meta = PLATFORM_BY_ID[platId] || PLATFORM_BY_ID.instagram;
    const cMap = loadSavedConnectionsMap();
    const tMap = loadSavedTokensMap();
    delete cMap[meta.id];
    delete tMap[meta.id];
    localStorage.setItem(scopedKey('sa_connections_map'), JSON.stringify(cMap));
    localStorage.setItem(scopedKey('sa_tokens_map'), JSON.stringify(tMap));
    if (meta.id === 'instagram') {
      localStorage.removeItem(scopedKey('sa_connection'));
      localStorage.removeItem(scopedKey('sa_ig_access_token'));
    }
    if (meta.id === 'threads') {
      localStorage.setItem(scopedKey('sa_threads_auto_optout'), '1');
    }
    setConnectionsMap({ ...cMap });
    if (connectPlatform === meta.id) {
      setHandleInput('');
      setTokenInput('');
    }
    setAnalyticsByPlatform((prev) => {
      const next = { ...prev };
      delete next[meta.id];
      const remainingIds = PLATFORMS.map((p) => p.id).filter((id) => cMap[id]?.handle);
      const nextSelected =
        remainingIds.length > 1 ? 'all' : remainingIds[0] || 'instagram';
      setSelectedPlatform(nextSelected);
      const snap = getActiveAnalyticsSnapshot(next, cMap, nextSelected);
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, snap));
      return next;
    });
    setConnectStatusMsg({
      type: 'success',
      text: `Disconnected ${meta.name} account from your workspace.`,
    });
    showToast(`${meta.name} account disconnected`);
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    const keywordsList = newFlow.keywords
      .split(',')
      .map((k) => k.trim().toUpperCase())
      .filter(Boolean);
    const created = {
      id: `flow-${Date.now()}`,
      ...newFlow,
      platform: newFlow.platform || 'all',
      keywords: keywordsList,
      active: true,
      stats: { triggered: 0, dms_sent: 0, link_clicks: 0 },
    };
    const next = [created, ...automations];
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    showToast(`Created automation "${newFlow.name}"!`);
    setShowNewFlow(false);
    triggerFairyWand();
  };

  const handleCreatePlannerAutoDmFlow = ({ name, keyword, url, platform }) => {
    const kw = (keyword || '').trim().toUpperCase();
    if (!kw) return;
    const alreadyExists = automations.some(
      (f) => f.trigger_type === 'comment_keyword' && (f.keywords || []).includes(kw)
    );
    if (alreadyExists) return;
    const created = {
      id: `flow-${Date.now()}`,
      name: name || `Planner Auto-DM (${kw})`,
      platform: platform || 'all',
      trigger_type: 'comment_keyword',
      keywords: [kw],
      public_comment_reply: 'Just sent it to your DMs! Check your message requests ✨🧚‍♀️',
      dm_message: `Hey! 👋 Thanks for commenting "${kw}"! Tap below to open the link:`,
      dm_button_text: 'Open Link ✨',
      dm_button_url: url || 'https://example.com',
      active: true,
      stats: { triggered: 0, dms_sent: 0, link_clicks: 0 },
    };
    const next = [created, ...automations];
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
  };

  const handleToggleFlow = async (id) => {
    const next = automations.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    triggerFairyWand();
  };

  const handleDeleteFlow = async (id) => {
    const next = automations.filter((f) => f.id !== id);
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    showToast('Automation deleted');
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    triggerFairyWand();
    const expectedTrigger =
      simType === 'comment'
        ? 'comment_keyword'
        : simType === 'story_reply'
        ? 'story_reply'
        : 'dm_keyword';
    const textUpper = simText.toUpperCase();
    let matchedFlow = null;
    let matchedKeyword = '';
    for (const flow of automations) {
      if (!flow.active || flow.trigger_type !== expectedTrigger) continue;
      const flowPlat = flow.platform || 'all';
      if (selectedPlatform !== 'all' && flowPlat !== 'all' && flowPlat !== selectedPlatform) {
        continue;
      }
      for (const kw of flow.keywords || []) {
        if (textUpper.includes(kw.toUpperCase())) {
          matchedFlow = flow;
          matchedKeyword = kw.toUpperCase();
          break;
        }
      }
      if (matchedFlow) break;
    }
    if (!matchedFlow) {
      setSimResult({
        matched: false,
        message: `No active ${simType} automation matched: "${simText}"`,
      });
      return;
    }
    const logEntry = {
      id: `log-${Date.now()}`,
      platform: selectedPlatform === 'all' ? matchedFlow.platform || 'all' : selectedPlatform,
      event_type: simType,
      sender_username: simUser.replace(/^@/, ''),
      incoming_text: simText,
      matched_flow_name: matchedFlow.name,
      matched_keyword: matchedKeyword,
      public_comment_reply: matchedFlow.public_comment_reply || '',
      dm_sent: matchedFlow.dm_message,
      dm_button_text: matchedFlow.dm_button_text || '',
      dm_button_url: matchedFlow.dm_button_url || '',
    };
    const nextLogs = [logEntry, ...logs].slice(0, 30);
    setLogs(nextLogs);
    localStorage.setItem(scopedKey('sa_logs'), JSON.stringify(nextLogs));
    setSimResult({ matched: true, flow: matchedFlow, log: logEntry });
  };

  const handleRefreshAnalytics = async () => {
    setSyncing(true);
    try {
      const cMap = loadSavedConnectionsMap();
      if (selectedPlatform === 'all') {
        const connectedIds = PLATFORMS.map((p) => p.id).filter((id) => cMap[id]?.handle);
        if (connectedIds.length === 0) {
          showToast('Connect at least one social platform first!', 'error');
          setActiveTab('connect');
          return;
        }
        await Promise.all(
          connectedIds.map((pid) =>
            fetchPlatformAnalytics({
              platformId: pid,
              overrideHandle: cMap[pid].handle,
              forceRefresh: true,
            })
          )
        );
        triggerFairyWand();
        showToast(`Synced live metrics across ${connectedIds.length} connected platform(s)!`);
      } else {
        const meta = PLATFORM_BY_ID[selectedPlatform] || PLATFORM_BY_ID.instagram;
        if (!cMap[meta.id]?.handle) {
          setConnectPlatform(meta.id);
          setActiveTab('connect');
          showToast(`Connect your ${meta.name} account first!`, 'error');
          return;
        }
        const fresh = await fetchPlatformAnalytics({
          platformId: meta.id,
          overrideHandle: cMap[meta.id].handle,
          forceRefresh: true,
        });
        triggerFairyWand();
        const liveFollowers = (fresh?.profile?.followers_count || 0).toLocaleString();
        showToast(
          `Live ${meta.name} sync complete! (${liveFollowers} ${meta.audienceLabel.toLowerCase()})`
        );
      }
    } catch {
      showToast('Could not reach live endpoint — showing last known snapshot.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyStrategyKeyword = (keyword, title) => {
    const snap = getActiveAnalyticsSnapshot();
    const activeHandle =
      snap?.profile?.username ||
      (selectedPlatform !== 'all' ? connectionsMap[selectedPlatform]?.handle : '') ||
      'creator';
    setNewFlow({
      name: `${title.slice(0, 36)}...`,
      platform: selectedPlatform === 'all' ? 'all' : selectedPlatform,
      trigger_type: keyword === '🔥' ? 'story_reply' : 'comment_keyword',
      keywords: keyword,
      public_comment_reply:
        keyword === '🔥'
          ? ''
          : `Sent it straight to your DMs! Check your message requests ✨🧚‍♀️`,
      dm_message: `Hey! 👋 Thanks for engaging with @${activeHandle}! Here is the ${keyword} resource from my post:`,
      dm_button_text: `Get ${keyword} Resource ✨`,
      dm_button_url: 'https://example.com',
    });
    setActiveTab('automations');
    setShowNewFlow(true);
    triggerFairyWand();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openPolicies = (section = 'terms') => {
    setPoliciesModal({ open: true, section });
  };

  const switchAuthTab = (nextMode) => {
    setAuthMode(nextMode);
    setResetMode(false);
    setRecoveryMode(false);
    setPendingConfirmEmail('');
    setTermsHighlight(false);
    setLoginError('');
    setLoginInfo('');
    setLoginPassword('');
    setConfirmPassword('');
  };

  const handleGoogleAuth = async (intent) => {
    setLoginError('');
    setLoginInfo('');
    setPendingConfirmEmail('');

    // Require legal terms agreement on Sign Up (same policy rule as labfae)
    if (intent === 'signup' && !agreedToTerms) {
      setTermsHighlight(true);
      setLoginError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setTermsHighlight(false);
    setAuthSubmitting(true);

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const redirectUrl = `${baseUrl}?auth_intent=${intent}`;
    setOAuthIntent(intent);

    try {
      const settingsResp = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      });
      if (settingsResp.ok) {
        const settings = await settingsResp.json();
        if (settings?.external && settings.external.google === false) {
          clearOAuthIntent();
          setAuthSubmitting(false);
          setLoginError(
            'Google provider is not enabled yet in your Supabase project (Authentication → Sign In / Providers → Google).'
          );
          return;
        }
      }
    } catch {
      // Proceed to OAuth redirect if preflight settings check cannot reach endpoint
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      clearOAuthIntent();
      setAuthSubmitting(false);
      setLoginError(error.message);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    const normalizedEmail = loginUser.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setLoginError('Please enter your registered email address first.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${baseUrl}?auth_intent=recovery`,
      });
      if (error) {
        setLoginError(error.message);
      } else {
        setLoginInfo(`Password reset link sent to ${normalizedEmail}! Check your email inbox.`);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSaveRecoveredPassword = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }
    if (loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: loginPassword,
      });
      if (error) {
        setLoginError(error.message);
        return;
      }
      const email = (data?.user?.email || loginUser || '').toLowerCase();
      setRecoveryMode(false);
      setLoginPassword('');
      setConfirmPassword('');
      if (data?.user) {
        verifiedUserIdsRef.current.add(data.user.id);
        sessionStorage.setItem('sa_user_email', email);
        setCurrentUserEmail(email);
        setCurrentUsername(data.user.user_metadata?.username || '');
        setIsAuthenticated(true);
        await fetchAll(email);
        showToast('Password updated! Welcome back.');
      } else {
        setLoginInfo('Password updated! You can now log in.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = pendingConfirmEmail || loginUser.trim().toLowerCase();
    if (!targetEmail) return;
    setAuthSubmitting(true);
    setLoginError('');
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${baseUrl}?auth_intent=signup`,
        },
      });
      if (error) {
        setLoginError(error.message);
      } else {
        setPendingConfirmEmail('');
        setLoginInfo(`Sent a fresh verification link to ${targetEmail}! Check your inbox (and spam folder).`);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    setPendingConfirmEmail('');
    clearOAuthIntent();

    const normalizedEmail = loginUser.trim().toLowerCase();
    const trimmedUsername = signupUsername.trim();

    if (authMode === 'signup' && !trimmedUsername) {
      setLoginError('Please enter a username.');
      return;
    }

    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    if (authMode === 'signup') {
      if (loginPassword.length < 6) {
        setLoginError('Password must be at least 6 characters long.');
        return;
      }
      if (loginPassword !== confirmPassword) {
        setLoginError('Passwords do not match. Please double-check both password fields.');
        return;
      }
      if (!agreedToTerms) {
        setTermsHighlight(true);
        setLoginError('Please agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }

      setTermsHighlight(false);
      setAuthSubmitting(true);
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: loginPassword,
          options: {
            emailRedirectTo: `${baseUrl}?auth_intent=signup`,
            data: {
              username: trimmedUsername,
              sa_registered: true,
              sa_registered_at: nowIso,
              accepted_terms: true,
              accepted_terms_date: nowIso,
            },
          },
        });

        if (error) {
          setLoginError(error.message);
          return;
        }

        // Supabase returns empty identities array if email is already registered (same check as labfae)
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setAuthMode('signin');
          setLoginPassword('');
          setConfirmPassword('');
          setLoginError(
            `An account with ${normalizedEmail} already exists. Please log in below (or click "Forgot password?" to reset access).`
          );
          return;
        }

        if (data?.session && data?.user) {
          verifiedUserIdsRef.current.add(data.user.id);
          sessionStorage.setItem('sa_user_email', normalizedEmail);
          setCurrentUserEmail(normalizedEmail);
          setCurrentUsername(trimmedUsername);
          setIsAuthenticated(true);
          setLoginPassword('');
          setConfirmPassword('');
          await fetchAll(normalizedEmail);
          triggerFairyWand();
          showToast(`Account created! Welcome, ${trimmedUsername}`);
          return;
        }

        setAuthMode('signin');
        setLoginPassword('');
        setConfirmPassword('');
        setLoginInfo(
          `Account created! Please check ${normalizedEmail} to confirm your email, then log in below.`
        );
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    // Regular Log In Mode — strictly requires an existing registered account
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      if (error || !data?.user) {
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          setPendingConfirmEmail(normalizedEmail);
          setLoginError(
            `Please confirm your email first — check ${normalizedEmail} for your verification link before logging in.`
          );
        } else {
          setLoginError(
            'No matching account or wrong password. Only users who have signed up can log in — switch to Sign Up above to create an account first!'
          );
        }
        return;
      }

      verifiedUserIdsRef.current.add(data.user.id);
      if (data.user.user_metadata?.sa_registered !== true) {
        supabase.auth
          .updateUser({
            data: {
              sa_registered: true,
              sa_registered_at: new Date().toISOString(),
            },
          })
          .catch(() => {});
      }

      sessionStorage.setItem('sa_user_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setCurrentUsername(
        data.user.user_metadata?.username || data.user.user_metadata?.full_name || ''
      );
      setIsAuthenticated(true);
      setLoginPassword('');
      setConfirmPassword('');
      await fetchAll(normalizedEmail);
      triggerFairyWand();
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    signingOutGuardRef.current = true;
    clearOAuthIntent();
    sessionStorage.removeItem('sa_authenticated');
    sessionStorage.removeItem('sa_user_email');
    setCurrentUserEmail('');
    setCurrentUsername('');
    setConnectionsMap({});
    setAnalyticsByPlatform({});
    setHandleInput('');
    setTokenInput('');
    await supabase.auth.signOut().catch(() => {});
    signingOutGuardRef.current = false;
    setIsAuthenticated(false);
    setAuthMode('signin');
    setResetMode(false);
    setRecoveryMode(false);
    setLoginPassword('');
    setConfirmPassword('');
    setLoginError('');
    setLoginInfo('You have been logged out.');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center p-4">
        <div className="editorial-card px-8 py-6 flex items-center gap-4 bg-white">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF7EB6]" />
          <span className="font-display text-lg font-bold">
            Verifying SocialAssist account...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isSignUp = authMode === 'signup';
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center p-4">
        <PoliciesModal
          isOpen={policiesModal.open}
          initialSection={policiesModal.section}
          onClose={() => setPoliciesModal((prev) => ({ ...prev, open: false }))}
        />

        <div className="editorial-card max-w-md w-full p-6 sm:p-7 bg-white space-y-4 panel-enter">
          {/* Compact Studio Header so Regular Form + Google Auth + Policies all fit cleanly */}
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] overflow-hidden flex items-center justify-center">
              <TechFairyCharacter isCasting={false} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE4F1] border border-[#19154E] text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#19154E]" />
                <span>SocialAssist Studio</span>
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#19154E]">
                {recoveryMode
                  ? 'Set New Password'
                  : resetMode
                  ? 'Reset Password'
                  : isSignUp
                  ? 'Create Account'
                  : 'Log In'}
              </h1>
              <p className="text-xs text-neutral-600 font-medium leading-snug">
                {recoveryMode
                  ? 'Choose a new password for your SocialAssist account.'
                  : resetMode
                  ? "Enter your email and we'll send you a recovery link."
                  : isSignUp
                  ? 'Sign up with Email or Google to unlock your creator workspace.'
                  : 'Welcome back! Log in with a registered Email or Google account.'}
              </p>
            </div>
          </div>

          {/* Explicit Log In / Sign Up Tab Bar */}
          {!recoveryMode && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E]">
              <button
                type="button"
                data-testid="tab-login"
                onClick={() => switchAuthTab('signin')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-colors duration-150 ${
                  !isSignUp
                    ? 'bg-[#19154E] text-[#FFF8FC] shadow-[2px_2px_0px_#FF7EB6]'
                    : 'text-[#19154E] hover:bg-white/80'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                data-testid="tab-signup"
                onClick={() => switchAuthTab('signup')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-colors duration-150 ${
                  isSignUp
                    ? 'bg-[#19154E] text-[#FFF8FC] shadow-[2px_2px_0px_#C8F904]'
                    : 'text-[#19154E] hover:bg-white/80'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {loginError && (
            <div
              role="alert"
              data-testid="auth-error"
              className="p-3 rounded-xl bg-[#FFE4F1] border-2 border-[#19154E] text-xs font-bold text-[#19154E] text-center space-y-2"
            >
              <div>{loginError}</div>
              {pendingConfirmEmail && (
                <button
                  type="button"
                  disabled={authSubmitting}
                  onClick={handleResendConfirmation}
                  className="px-3 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold underline hover:bg-[#F5EEFF]"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {loginInfo && (
            <div
              role="status"
              data-testid="auth-info"
              className="p-3 rounded-xl bg-[#E8FFF3] border-2 border-[#19154E] text-xs font-bold text-[#19154E] text-center"
            >
              {loginInfo}
            </div>
          )}

          {/* MODE A: Set New Password after clicking Email Recovery Link */}
          {recoveryMode ? (
            <form onSubmit={handleSaveRecoveredPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm"
              >
                {authSubmitting ? 'Saving...' : 'Save New Password →'}
              </button>
            </form>
          ) : resetMode ? (
            /* MODE B: Forgot Password Request (matches Labfae LogIn.jsx) */
            <form onSubmit={handlePasswordResetRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm"
              >
                {authSubmitting ? 'Sending link...' : 'Send Recovery Link →'}
              </button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setLoginError('');
                    setLoginInfo('');
                  }}
                  className="text-xs font-bold text-[#19154E] underline hover:opacity-80"
                >
                  Remembered it? Back to Log In
                </button>
              </div>
            </form>
          ) : (
            /* MODE C: Regular Log In / Regular Sign Up + Google Log In / Google Sign Up */
            <>
              <form onSubmit={handleEmailAuth} noValidate className="space-y-3">
                {isSignUp && (
                  <div>
                    <label
                      htmlFor="sa-username"
                      className="block text-xs font-bold text-[#19154E] mb-1"
                    >
                      Username
                    </label>
                    <input
                      id="sa-username"
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="sa-email" className="block text-xs font-bold text-[#19154E] mb-1">
                    Email
                  </label>
                  <input
                    id="sa-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sa-password" className="block text-xs font-bold text-[#19154E]">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode(true);
                          setLoginError('');
                          setLoginInfo('');
                        }}
                        className="text-[11px] font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="sa-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={isSignUp ? 6 : 1}
                      placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#19154E]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label
                      htmlFor="sa-confirm-password"
                      className="block text-xs font-bold text-[#19154E] mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="sa-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                    />
                  </div>
                )}

                {/* Legal Terms Agreement Checkbox on Sign Up (matches Labfae SignUpSupabase.jsx) */}
                {isSignUp && (
                  <div
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 transition-colors ${
                      termsHighlight
                        ? 'bg-[#FFE4F1] border-[#FF2E88]'
                        : 'bg-[#F5EEFF]/60 border-[#19154E]/30'
                    }`}
                  >
                    <input
                      id="sa-policy-check"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) {
                          setTermsHighlight(false);
                          if (loginError.includes('Terms of Service')) {
                            setLoginError('');
                          }
                        }
                      }}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-[#FF7EB6] cursor-pointer"
                    />
                    <label
                      htmlFor="sa-policy-check"
                      className="text-xs text-[#19154E] font-medium leading-snug cursor-pointer"
                    >
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openPolicies('terms');
                        }}
                        className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openPolicies('privacy');
                        }}
                        className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Privacy Policy
                      </button>
                      .
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="submit-email-auth"
                  disabled={authSubmitting}
                  className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>
                    {authSubmitting
                      ? isSignUp
                        ? 'Creating account...'
                        : 'Logging in...'
                      : isSignUp
                      ? 'Complete Sign Up →'
                      : 'Log In →'}
                  </span>
                </button>
              </form>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t-2 border-dashed border-neutral-300" />
                <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  or
                </span>
                <div className="flex-grow border-t-2 border-dashed border-neutral-300" />
              </div>

              {/* Dedicated Google Log In vs Google Sign Up Button */}
              <button
                type="button"
                data-testid="submit-google-auth"
                disabled={authSubmitting}
                onClick={() => handleGoogleAuth(isSignUp ? 'signup' : 'signin')}
                className={`w-full editorial-btn py-2.5 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-60 ${
                  isSignUp
                    ? 'bg-[#C8F904] hover:bg-[#d4ff2a] text-[#19154E]'
                    : 'bg-white hover:bg-[#FFF8FC] text-[#19154E]'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{isSignUp ? 'Sign up with Google' : 'Log in with Google'}</span>
              </button>

              <div className="text-center pt-0.5 space-y-1.5">
                <div>
                  <span className="text-xs text-neutral-600 font-medium">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchAuthTab(isSignUp ? 'signin' : 'signup')}
                    className="text-xs font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                  >
                    {isSignUp ? 'Log in' : 'Sign up'}
                  </button>
                </div>

                {!isSignUp && (
                  <p className="text-[11px] text-neutral-500">
                    Protected by our{' '}
                    <button
                      type="button"
                      onClick={() => openPolicies('terms')}
                      className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                    >
                      Terms of Service
                    </button>{' '}
                    &amp;{' '}
                    <button
                      type="button"
                      onClick={() => openPolicies('privacy')}
                      className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                )}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-500">
            <a href="../index.html" className="hover:text-[#19154E]">
              ← TechFairyLab
            </a>
            <button
              type="button"
              onClick={() => openPolicies('privacy')}
              className="hover:text-[#19154E] underline"
            >
              Legal &amp; Policies
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center">
        <div className="editorial-card px-8 py-6 flex items-center gap-4 bg-white">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF7EB6]" />
          <span className="font-display text-lg font-bold">
            Waking up SocialAssist Studio...
          </span>
        </div>
      </div>
    );
  }

  const baseFallback = EMPTY_WORKSPACE_ANALYTICS;
  const analyticsData = getActiveAnalyticsSnapshot();
  const connection = connectionsMap?.instagram || null;
  const connectedPlatformIds = PLATFORMS.map((p) => p.id).filter(
    (id) => connectionsMap[id]?.handle
  );
  const activePlatformMeta =
    selectedPlatform === 'all' ? null : PLATFORM_BY_ID[selectedPlatform] || PLATFORM_BY_ID.instagram;
  const connectMeta = PLATFORM_BY_ID[connectPlatform] || PLATFORM_BY_ID.instagram;
  const activePlatformLabel =
    selectedPlatform === 'all' ? 'All Connected Platforms' : activePlatformMeta.name;
  const activeAudienceLabel =
    selectedPlatform === 'all' ? 'Followers / Subscribers' : activePlatformMeta.audienceLabel;
  const activeContentLabel =
    selectedPlatform === 'all' ? 'Posts & Videos' : activePlatformMeta.contentLabel;

  const isUnconnected = analyticsData?.source === 'unconnected_workspace';
  const profile = analyticsData?.profile || baseFallback.profile;
  const summary = {
    ...baseFallback.analysis.summary,
    ...(analyticsData?.analysis?.summary || {}),
  };
  const strategies = analyticsData?.analysis?.strategies || baseFallback.analysis.strategies;
  const contentIdeas =
    analyticsData?.analysis?.content_ideas || baseFallback.analysis.content_ideas;
  const rawPosts = isUnconnected
    ? []
    : analyticsData?.posts && analyticsData.posts.length > 0
    ? analyticsData.posts
    : baseFallback.posts;
  const posts = rawPosts.map((p) => {
    const views = typeof p.views === 'number' ? p.views : 0;
    const likes = typeof p.likes === 'number' ? p.likes : 0;
    const comments = typeof p.comments === 'number' ? p.comments : 0;
    const saves = typeof p.saves === 'number' ? p.saves : null;
    const shares = typeof p.shares === 'number' ? p.shares : null;
    const followersGained =
      typeof p.followers_gained === 'number' ? p.followers_gained : null;
    const engagementRate =
      typeof p.engagement_rate === 'number'
        ? p.engagement_rate
        : views > 0
        ? Number((((likes + comments + (saves || 0) + (shares || 0)) / views) * 100).toFixed(2))
        : 0;
    const postPlatId = p.platform || (selectedPlatform === 'all' ? 'instagram' : selectedPlatform);
    const postPlatMeta = PLATFORM_BY_ID[postPlatId] || PLATFORM_BY_ID.instagram;
    return {
      ...p,
      platform: postPlatId,
      platformName: p.platformName || postPlatMeta.name,
      views,
      likes,
      comments,
      saves,
      shares,
      followers_gained: followersGained,
      follower_conversion_rate:
        followersGained !== null && views > 0
          ? Number(((followersGained / views) * 100).toFixed(2))
          : null,
      engagement_rate: engagementRate,
      title: p.title || (p.caption || '').split('\n')[0].slice(0, 68) || `${postPlatMeta.name} Post`,
      published_label: p.published_label || postPlatMeta.shortName,
      thumbnail_url: p.thumbnail_url || '',
      fallback_thumbnail_url: p.fallback_thumbnail_url || '',
      video_summary_text:
        p.video_summary_text ||
        `CAPTION: ${(p.caption || '').slice(0, 140)} | LIVE METRICS: ${views.toLocaleString()} views, ${likes.toLocaleString()} likes, ${comments.toLocaleString()} comments (${engagementRate}% engagement rate).`,
    };
  });

  const hasFollowerInsights = posts.some((p) => typeof p.followers_gained === 'number');
  const sortedPosts = [...posts].sort((a, b) => {
    if (videoSortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (videoSortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
    if (videoSortBy === 'engagement') return (b.engagement_rate || 0) - (a.engagement_rate || 0);
    if (videoSortBy === 'recent')
      return (b.taken_at_timestamp || 0) - (a.taken_at_timestamp || 0);
    if (videoSortBy === 'followers' && hasFollowerInsights)
      return (b.followers_gained || 0) - (a.followers_gained || 0);
    return (b.views || 0) - (a.views || 0);
  });

  const topByViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || {};
  const topByComments = [...posts].sort((a, b) => (b.comments || 0) - (a.comments || 0))[0] || {};
  const avgLikesPerPost =
    posts.length > 0 ? Math.round((summary.total_likes || 0) / posts.length) : 0;

  const isLiveSynced = Boolean(
    analyticsData?.source && analyticsData.source !== 'unconnected_workspace'
  );
  const isGraphApiLive = Boolean(analyticsData?.source?.includes('_api'));
  const syncedTimeLabel = analyticsData?.fetched_at
    ? new Date(analyticsData.fetched_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const usActivity =
    analyticsData?.analysis?.us_audience_activity || INITIAL_ANALYTICS.analysis.us_audience_activity;
  const openclawBrief =
    analyticsData?.analysis?.openclaw_brief || INITIAL_ANALYTICS.analysis.openclaw_brief;

  const visibleAutomations = automations.filter((f) => {
    const fp = f.platform || 'all';
    return selectedPlatform === 'all' || fp === 'all' || fp === selectedPlatform;
  });

  const activeFlowsCount = automations.filter((a) => a.active).length;
  const navItems = [
    { id: 'analytics', label: 'Overview', icon: BarChart3, accent: 'text-[#C8F904]' },
    { id: 'planner', label: 'Planner', icon: Calendar, accent: 'text-[#FF7EB6]' },
    {
      id: 'automations',
      label: 'Auto-DMs',
      icon: MessageSquare,
      accent: 'text-[#B799E8]',
      badge: activeFlowsCount > 0 ? String(activeFlowsCount) : null,
    },
    { id: 'strategy', label: 'AI Strategy', icon: Sparkles, accent: 'text-[#C8F904]' },
    {
      id: 'connect',
      label: 'Connections',
      icon: KeyRound,
      accent: 'text-[#FF7EB6]',
      badge: `${connectedPlatformIds.length}/6`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex flex-col lg:flex-row">
      <PoliciesModal
        isOpen={policiesModal.open}
        initialSection={policiesModal.section}
        onClose={() => setPoliciesModal((prev) => ({ ...prev, open: false }))}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border-2 border-[#19154E] shadow-[4px_4px_0px_#19154E] flex items-center gap-3 text-sm font-bold panel-enter ${
            toast.type === 'error'
              ? 'bg-[#FF7EB6] text-[#19154E]'
              : 'bg-[#C8F904] text-[#19154E]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ============================================================
          TIER 1 (DESKTOP): PERSISTENT LEFT SIDEBAR RAIL
      ============================================================ */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 lg:flex-col lg:sticky lg:top-0 lg:h-screen bg-[#FFFDF9] border-r-2 border-[#19154E] shrink-0 justify-between p-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={triggerFairyWand}
                aria-label="Trigger studio mascot sparkle"
                title="Tap mascot for a studio sparkle!"
                className="w-11 h-11 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] shadow-[2px_2px_0px_#19154E] overflow-hidden flex items-center justify-center shrink-0 hover:-translate-y-0.5 transition-transform"
              >
                <TechFairyCharacter
                  isCasting={isCastingWand}
                  mood={isCastingWand ? 'excited' : 'happy'}
                />
              </button>
              <div className="min-w-0">
                <h1 className="font-display font-bold text-lg tracking-tight text-[#19154E] leading-tight">
                  SocialAssist
                </h1>
                <a
                  href="../index.html"
                  className="text-[11px] font-bold text-neutral-500 hover:text-[#6D28D9] transition-colors inline-flex items-center gap-1"
                  title="Return to TechFairyLab Home"
                >
                  <span>← TechFairyLab</span>
                </a>
              </div>
            </div>
          </div>

          <nav aria-label="Primary Workspace Navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#19154E] text-[#FFF8FC] shadow-[3px_3px_0px_#FF7EB6]'
                      : 'text-[#19154E] hover:bg-[#F5EEFF]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? item.accent : 'text-[#19154E]'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[11px] tabular-nums px-2 py-0.5 rounded-full border font-extrabold ${
                        isActive
                          ? 'bg-[#C8F904] text-[#19154E] border-[#19154E]'
                          : 'bg-[#F5EEFF] text-[#19154E] border-[#19154E]/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Account & Legal Footer */}
        <div className="pt-4 border-t-2 border-neutral-200/80 space-y-2.5">
          <div className="px-2 py-1.5 rounded-xl bg-[#F5EEFF]/70 border border-[#19154E]/20">
            <div className="text-[11px] font-bold text-[#19154E] truncate">
              {currentUsername || currentUserEmail || 'Creator Workspace'}
            </div>
            {currentUserEmail && currentUsername && (
              <div className="text-[10px] font-medium text-neutral-600 truncate">
                {currentUserEmail}
              </div>
            )}
            <button
              type="button"
              onClick={() => openPolicies('terms')}
              className="mt-1 text-[10px] font-bold text-[#6D28D9] hover:underline"
            >
              Terms &amp; Privacy
            </button>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title={
              currentUserEmail
                ? `Signed in as ${currentUserEmail} — click to sign out`
                : 'Sign Out'
            }
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#19154E] bg-white hover:bg-[#FFE4F1] border-2 border-[#19154E] transition-colors duration-150"
          >
            <LogOut className="w-3.5 h-3.5 text-[#FF7EB6]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ============================================================
          TIER 1 (MOBILE / TABLET): COMPACT STICKY HEADER + TAB STRIP
      ============================================================ */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#FFF8FC]/95 backdrop-blur-md border-b-2 border-[#19154E]">
        <div className="px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E] flex items-center justify-center text-white shrink-0">
              <PlatformIcon
                platform={selectedPlatform === 'all' ? 'globe' : selectedPlatform}
                className="w-4 h-4"
              />
            </div>
            <span className="font-display font-bold text-lg text-[#19154E] truncate">
              SocialAssist
            </span>
            <a
              href="../index.html"
              className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-[#19154E] font-bold text-neutral-700"
            >
              ← Home
            </a>
          </div>

          <div className="flex items-center gap-1.5">
            {connectedPlatformIds.length > 0 && (
              <button
                type="button"
                onClick={handleRefreshAnalytics}
                disabled={syncing}
                aria-label="Sync live stats"
                className="p-2 rounded-xl bg-[#C8F904] border-2 border-[#19154E] text-[#19154E]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign Out"
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border-2 border-[#19154E] text-[#19154E] inline-flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF7EB6]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Mobile Workspace Navigation"
          className="px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors ${
                  isActive ? 'bg-[#19154E] text-[#FFF8FC]' : 'bg-white text-[#19154E]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? item.accent : 'text-[#19154E]'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] tabular-nums opacity-85">({item.badge})</span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ============================================================
          RIGHT WORKSPACE COLUMN: GLOBAL CHANNEL BAR + MAIN CONTENT
      ============================================================ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TIER 2: SINGLE GLOBAL CHANNEL FILTER & LIVE SYNC BAR */}
        <div className="lg:sticky lg:top-0 z-20 bg-[#FFF8FC]/95 backdrop-blur-md border-b-2 border-[#19154E] px-4 sm:px-6 py-2.5">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
            {activeTab !== 'connect' ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full">
                <button
                  type="button"
                  data-testid="switch-platform-all"
                  onClick={() => {
                    setSelectedPlatform('all');
                    const snap = getActiveAnalyticsSnapshot(undefined, undefined, 'all');
                    setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, snap));
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] inline-flex items-center gap-1.5 transition-colors duration-150 ${
                    selectedPlatform === 'all'
                      ? 'bg-[#19154E] text-[#FFF8FC]'
                      : 'bg-white text-[#19154E] hover:bg-[#EDE9FE]'
                  }`}
                >
                  <span>🌐 All</span>
                  <span className="text-[10px] tabular-nums px-1.5 py-0.2 rounded bg-[#C8F904] text-[#19154E] font-extrabold">
                    {connectedPlatformIds.length}
                  </span>
                </button>

                {PLATFORMS.map((p) => {
                  const conn = connectionsMap[p.id];
                  const isSelected = selectedPlatform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`switch-platform-${p.id}`}
                      onClick={() => {
                        if (!conn?.handle) {
                          handleSelectConnectPlatform(p.id);
                          setActiveTab('connect');
                          return;
                        }
                        setSelectedPlatform(p.id);
                        const snap = getActiveAnalyticsSnapshot(undefined, undefined, p.id);
                        setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, snap));
                      }}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] inline-flex items-center gap-1.5 transition-colors duration-150 ${
                        isSelected
                          ? 'bg-[#C8F904] text-[#19154E] shadow-[2px_2px_0px_#19154E]'
                          : conn?.handle
                          ? 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                          : 'bg-neutral-100/90 text-neutral-500 hover:bg-white hover:text-[#19154E]'
                      }`}
                      title={
                        conn?.handle
                          ? `Filter by @${conn.handle} on ${p.name}`
                          : `Click to connect ${p.name}`
                      }
                    >
                      <PlatformIcon platform={p.id} className="w-3.5 h-3.5" />
                      <span>{p.name}</span>
                      {conn?.handle ? (
                        <span className="text-[10px] font-mono-code opacity-80 hidden sm:inline">
                          @{conn.handle}
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-[#6D28D9]">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-[#19154E]">
                <ShieldCheck className="w-4 h-4 text-[#6D28D9]" />
                <span>Account Connections</span>
                <span className="text-neutral-400">•</span>
                <span className="tabular-nums text-[#6D28D9]">
                  {connectedPlatformIds.length} of 6 linked
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <span
                data-testid="signed-in-banner"
                className="text-[11px] font-semibold text-neutral-600 truncate max-w-[220px]"
              >
                {currentUserEmail
                  ? currentUsername
                    ? `Signed in as ${currentUsername} (${currentUserEmail})`
                    : `Signed in as ${currentUserEmail}`
                  : 'Creator Workspace'}
              </span>

              {connectedPlatformIds.length > 0 && activeTab !== 'connect' && (
                <button
                  type="button"
                  onClick={handleRefreshAnalytics}
                  disabled={syncing}
                  title={
                    syncedTimeLabel
                      ? `Last synced ${syncedTimeLabel} — click to refresh live metrics`
                      : 'Refresh live metrics'
                  }
                  className="hidden lg:inline-flex editorial-btn px-3 py-1.5 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span className="tabular-nums">
                    {syncing
                      ? 'Syncing...'
                      : syncedTimeLabel
                      ? `Sync • ${syncedTimeLabel}`
                      : 'Sync Live'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Compact Onboarding Callout ONLY when 0 accounts are connected */}
          {connectedPlatformIds.length === 0 && activeTab !== 'connect' && (
            <div className="editorial-card-sm p-4 bg-[#FFFDF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs sm:text-sm font-semibold text-[#19154E]">
                <strong>No social channels connected yet.</strong> Link Instagram, TikTok, YouTube,
                Facebook, X, or Threads to unlock live metrics and scheduling.
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('connect')}
                className="editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold shrink-0"
              >
                Connect Account →
              </button>
            </div>
          )}

          {/* ============================================================
              TAB 0: MULTI-PLATFORM CONTENT PLANNING CALENDAR
          ============================================================ */}
          {activeTab === 'planner' && (
            <PlannerCalendar
              scopedKey={scopedKey}
              igHandle={
                profile.username ||
                connectionsMap?.instagram?.handle ||
                connection?.instagram_handle ||
                ''
              }
              igAccessToken={
                loadSavedTokensMap()?.instagram ||
                localStorage.getItem(scopedKey('sa_ig_access_token')) ||
                ''
              }
              igAccountId={connectionsMap?.instagram?.account_id || connection?.account_id || ''}
              activeChannel={selectedPlatform}
              connectionsMap={connectionsMap}
              sharedTokensMap={loadSavedTokensMap()}
              oauthProviders={oauthProviders}
              onOneClickConnect={handleOneClickOAuthConnect}
              onNavigateConnect={(platId) => {
                if (platId) handleSelectConnectPlatform(platId);
                setActiveTab('connect');
              }}
              onCreateAutoDmFlow={handleCreatePlannerAutoDmFlow}
              showToast={showToast}
              triggerFairyWand={triggerFairyWand}
            />
          )}

        {/* ============================================================
            TAB 1: MANYCHAT-STYLE AUTOMATED DM STUDIO
        ============================================================ */}
        {activeTab === 'automations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 panel-enter">
            {/* Left 7 Cols: Automation Flows List & Builder */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#19154E]">
                    Automated Reply &amp; DM Flows ({activePlatformLabel})
                  </h3>
                  <p className="text-xs font-medium text-neutral-600">
                    Click any keyword badge below to test it live in the simulator →
                  </p>
                </div>
                <button
                  onClick={() => setShowNewFlow(!showNewFlow)}
                  className="editorial-btn px-4 py-2.5 rounded-2xl bg-[#C8F904] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Flow</span>
                </button>
              </div>

              {/* Create New Automation Form */}
              {showNewFlow && (
                <form
                  onSubmit={handleCreateFlow}
                  className="editorial-card p-6 bg-[#FFFDF9] space-y-4 panel-enter"
                >
                  <div className="flex items-center justify-between border-b-2 border-[#19154E] pb-3">
                    <h4 className="font-display font-bold text-base text-[#19154E] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FF7EB6]" />
                      <span>Build New Comment-to-DM / Auto-Reply Flow</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowNewFlow(false)}
                      className="text-xs font-bold text-neutral-500 hover:text-[#19154E]"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Flow Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Send AI Workflow Guide"
                        value={newFlow.name}
                        onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Target Platform
                      </label>
                      <select
                        value={newFlow.platform || 'all'}
                        onChange={(e) => setNewFlow({ ...newFlow, platform: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                      >
                        <option value="all">🌐 All Connected Platforms</option>
                        {PLATFORMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        When Trigger Happens
                      </label>
                      <select
                        value={newFlow.trigger_type}
                        onChange={(e) => setNewFlow({ ...newFlow, trigger_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                      >
                        <option value="comment_keyword">User comments on a Post / Video</option>
                        <option value="story_reply">User replies to your Story</option>
                        <option value="dm_keyword">User sends a Direct Message (DM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      Trigger Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="LINK, CODE, AI, PROMPT"
                      value={newFlow.keywords}
                      onChange={(e) => setNewFlow({ ...newFlow, keywords: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code font-bold text-[#6D28D9] focus:outline-none focus:bg-white"
                    />
                  </div>

                  {newFlow.trigger_type === 'comment_keyword' && (
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Step 1: Public Comment Auto-Reply (boosts post engagement!)
                      </label>
                      <input
                        type="text"
                        placeholder="Just sent the link to your DMs! ✨"
                        value={newFlow.public_comment_reply}
                        onChange={(e) =>
                          setNewFlow({ ...newFlow, public_comment_reply: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      Step 2: Private Automated DM / Reply Message
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newFlow.dm_message}
                      onChange={(e) => setNewFlow({ ...newFlow, dm_message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="Open Guide ✨"
                        value={newFlow.dm_button_text}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_text: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        CTA Button URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={newFlow.dm_button_url}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_url: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="editorial-btn px-6 py-2.5 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold"
                    >
                      Save &amp; Activate Flow ✨
                    </button>
                  </div>
                </form>
              )}

              {/* Automation Flow Bento Cards */}
              <div className="space-y-4">
                {visibleAutomations.map((flow) => {
                  const flowPlatMeta =
                    flow.platform && flow.platform !== 'all'
                      ? PLATFORM_BY_ID[flow.platform]
                      : null;
                  return (
                    <div
                      key={flow.id}
                      className={`editorial-card editorial-card-interactive p-5 ${
                        flow.active ? 'bg-white' : 'bg-[#F5EEFF]/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg border-2 border-[#19154E] bg-[#EDE9FE] text-[#19154E] inline-flex items-center gap-1">
                              {flowPlatMeta ? (
                                <>
                                  <PlatformIcon platform={flowPlatMeta.id} className="w-3 h-3" />
                                  <span>{flowPlatMeta.name}</span>
                                </>
                              ) : (
                                <span>🌐 All Platforms</span>
                              )}
                            </span>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border-2 border-[#19154E] ${
                                flow.trigger_type === 'comment_keyword'
                                  ? 'bg-[#FF7EB6] text-[#19154E]'
                                  : flow.trigger_type === 'story_reply'
                                  ? 'bg-[#B799E8] text-[#19154E]'
                                  : 'bg-[#6D28D9] text-white'
                              }`}
                            >
                              {flow.trigger_type === 'comment_keyword'
                                ? 'Comment → DM'
                                : flow.trigger_type === 'story_reply'
                                ? 'Story Reply → DM'
                                : 'Direct DM Keyword'}
                            </span>
                            <h4 className="font-display font-bold text-base text-[#19154E]">
                              {flow.name}
                            </h4>
                          </div>

                          {/* Interactive Keyword Pills */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-xs font-bold text-neutral-600">Keywords:</span>
                            {flow.keywords.map((kw) => (
                              <button
                                key={kw}
                                onClick={() => {
                                  setSimType(
                                    flow.trigger_type === 'comment_keyword'
                                      ? 'comment'
                                      : flow.trigger_type === 'story_reply'
                                      ? 'story_reply'
                                      : 'dm'
                                  );
                                  setSimText(`Can you send me ${kw} please?! ✨`);
                                  triggerFairyWand();
                                }}
                                title="Click to load this keyword into the simulator"
                                className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#C8F904] text-[#19154E] border-2 border-[#19154E] hover:bg-[#B799E8] transition-colors duration-150"
                              >
                                &quot;{kw}&quot;
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleToggleFlow(flow.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border-2 border-[#19154E] ${
                              flow.active
                                ? 'bg-[#C8F904] text-[#19154E]'
                                : 'bg-neutral-200 text-neutral-600'
                            }`}
                          >
                            {flow.active ? '● LIVE' : 'PAUSED'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFlow(flow.id)}
                            aria-label={`Delete ${flow.name} flow`}
                            className="p-1.5 rounded-xl border-2 border-transparent hover:border-[#19154E] text-neutral-500 hover:text-[#FF7EB6] transition-colors duration-150"
                            title="Delete flow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Two-Column Action Preview */}
                      <div className="mt-4 pt-3.5 border-t-2 border-dashed border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {flow.public_comment_reply ? (
                          <div className="p-3 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E]">
                            <div className="font-bold text-[#19154E] mb-1">
                              💬 1. Auto-Reply in Comments:
                            </div>
                            <p className="text-neutral-700 font-medium">{flow.public_comment_reply}</p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-2xl bg-[#FFF8FC]/60 border-2 border-dashed border-neutral-400 flex items-center text-neutral-500 font-medium">
                            1. Direct DM Flow (No public comment reply)
                          </div>
                        )}

                        <div className="p-3 rounded-2xl bg-[#EDE9FE] border-2 border-[#19154E]">
                          <div className="font-bold text-[#6D28D9] mb-1">
                            ✉️ 2. Private DM Sent:
                          </div>
                          <p className="text-[#19154E] font-medium line-clamp-2">{flow.dm_message}</p>
                          {flow.dm_button_text && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#19154E] text-white text-[11px] font-bold">
                              <span>{flow.dm_button_text}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Flow Metrics Footer */}
                      <div className="mt-3.5 flex items-center gap-6 text-xs font-bold text-neutral-600 tabular-nums">
                        <span>
                          Triggered: <strong className="text-[#19154E]">{flow.stats?.triggered || 0}</strong>
                        </span>
                        <span>
                          DMs Delivered: <strong className="text-[#6D28D9]">{flow.stats?.dms_sent || 0}</strong>
                        </span>
                        <span>
                          Link Clicks: <strong className="text-[#FF7EB6]">{flow.stats?.link_clicks || 0}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Cols: Interactive Phone Simulator & Live Activity Feed */}
            <div className="lg:col-span-5 space-y-5">
              <div className="editorial-card p-6 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B799E8] border-2 border-[#19154E]">
                      Interactive Sandbox • {activePlatformLabel}
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#19154E] mt-1">
                      Live Comment-to-DM Simulator
                    </h3>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Trigger Type
                      </label>
                      <select
                        value={simType}
                        onChange={(e) => setSimType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-bold"
                      >
                        <option value="comment">Comment on Post / Video</option>
                        <option value="story_reply">Story Reply</option>
                        <option value="dm">Direct Message</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Follower Handle
                      </label>
                      <input
                        type="text"
                        value={simUser}
                        onChange={(e) => setSimUser(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Test Comment or Message
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-semibold focus:outline-none focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="editorial-btn px-4 py-2 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Fire Test</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Cartoon Phone Frame Preview */}
                <div className="rounded-3xl bg-[#19154E] text-white p-4 border-2 border-[#19154E] space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 text-xs">
                    <span className="font-display font-bold text-[#FFF8FC]">
                      📱 {profile.username ? `@${profile.username}` : activePlatformLabel} Inbox
                    </span>
                    {simResult?.matched && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C8F904] text-[#19154E] text-[10px] font-bold">
                        Matched &quot;{simResult.log.matched_keyword}&quot;
                      </span>
                    )}
                  </div>

                  {!simResult ? (
                    <div className="py-7 text-center text-xs text-neutral-400">
                      Click <strong>Fire Test</strong> above to watch SocialAssist reply in the comments &amp; send the DM card!
                    </div>
                  ) : !simResult.matched ? (
                    <div className="p-3 rounded-2xl bg-[#FF7EB6]/20 border border-[#FF7EB6] text-xs text-[#B799E8] font-semibold">
                      {simResult.message}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs panel-enter">
                      {/* Follower's Incoming Comment */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#B799E8] text-[#19154E] border-2 border-white flex items-center justify-center text-xs font-extrabold shrink-0">
                          {simResult.log.sender_username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="p-3 rounded-2xl rounded-tl-none bg-neutral-800 text-white">
                          <div className="text-[10px] text-neutral-400 font-bold mb-0.5">
                            @{simResult.log.sender_username} • {simResult.log.event_type}
                          </div>
                          {simResult.log.incoming_text}
                        </div>
                      </div>

                      {/* Public Comment Auto-Reply */}
                      {simResult.log.public_comment_reply && (
                        <div className="ml-7 p-2.5 rounded-2xl bg-neutral-900 border border-[#C8F904] text-[#C8F904]">
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            ↪ Public Comment Reply Sent:
                          </div>
                          <span className="text-white">{simResult.log.public_comment_reply}</span>
                        </div>
                      )}

                      {/* Automated Private DM Card */}
                      <div className="flex items-start justify-end pt-1">
                        <div className="max-w-[88%] p-3.5 rounded-2xl rounded-tr-none bg-[#6D28D9] text-white border-2 border-white shadow-lg">
                          <div className="text-[10px] text-[#C8F904] font-bold uppercase tracking-wider mb-1">
                            ✨ Automated DM from {profile.username ? `@${profile.username}` : 'Creator'}
                          </div>
                          <p className="leading-relaxed font-medium">{simResult.log.dm_sent}</p>
                          {simResult.log.dm_button_text && (
                            <a
                              href={simResult.log.dm_button_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#C8F904] text-[#19154E] font-bold text-center flex items-center justify-center gap-1.5 hover:bg-[#B799E8] transition-colors duration-150"
                            >
                              <span>{simResult.log.dm_button_text}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Automated DM Log */}
              <div className="editorial-card p-5 bg-[#FFF8FC] space-y-3">
                <h4 className="font-display font-bold text-sm text-[#19154E]">
                  Recent Trigger Activity
                </h4>
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-600 font-medium">
                    No triggers logged yet. Click <strong>Fire Test</strong> above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {logs.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white border-2 border-[#19154E] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate font-medium">
                          <strong className="text-[#6D28D9]">@{item.sender_username}</strong>:{' '}
                          <span>&quot;{item.incoming_text}&quot;</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C8F904] border border-[#19154E]">
                          DM Sent ✓
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: LIVE PERFORMANCE OVERVIEW & POST ANALYTICS
        ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 panel-enter">
            {/* Compact Overview Header (KPIs immediately above the fold) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                    {selectedPlatform === 'all'
                      ? 'Omnichannel Overview'
                      : `${activePlatformLabel} Overview`}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#19154E] text-[11px] font-bold ${
                      isLiveSynced ? 'bg-[#C8F904] text-[#19154E]' : 'bg-[#FFE4F1] text-[#19154E]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full border border-[#19154E] ${
                        isLiveSynced ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span className="tabular-nums">
                      {isGraphApiLive
                        ? `Official ${activePlatformLabel} API`
                        : isLiveSynced
                        ? 'Live Synced'
                        : 'Awaiting Connection'}
                      {syncedTimeLabel ? ` • ${syncedTimeLabel}` : ''}
                    </span>
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-600 mt-0.5">
                  {selectedPlatform === 'all'
                    ? `Aggregated live followers, views, and engagement across ${connectedPlatformIds.length} connected channel(s).`
                    : `Real-time ${activeAudienceLabel.toLowerCase()} and post metrics for @${profile.username || 'your_account'}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('strategy');
                  handleRunOpenClaw();
                }}
                className="editorial-btn px-3.5 py-2 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze in AI Strategy</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 Bold Editorial Metric Cards — Live Multi-Platform Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                  <span>LIVE {activeAudienceLabel.toUpperCase()}</span>
                  <PlatformIcon
                    platform={selectedPlatform === 'all' ? 'globe' : selectedPlatform}
                    className="w-4 h-4 text-[#FF7EB6]"
                  />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5 tabular-nums">
                  {(profile.followers_count || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1 tabular-nums">
                  {(profile.media_count || 0).toLocaleString()} {activeContentLabel.toLowerCase()}
                  {profile.follows_count ? ` • ${profile.follows_count} following` : ''}
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#FF7EB6]">
                <div className="text-[11px] font-bold text-[#19154E] flex items-center justify-between">
                  <span>#1 POST VIEWS</span>
                  <Eye className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5 tabular-nums">
                  {(topByViews.views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1 truncate tabular-nums">
                  {(topByViews.likes || 0).toLocaleString()} likes • {(topByViews.comments || 0).toLocaleString()} comments
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                  <span>TRACKED VIEWS</span>
                  <TrendingUp className="w-4 h-4 text-[#6D28D9]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5 tabular-nums">
                  {(summary.total_views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1 tabular-nums">
                  Across {posts.length} synced items
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#C8F904]">
                <div className="text-[11px] font-bold text-[#19154E] flex items-center justify-between">
                  <span>LIVE LIKES</span>
                  <Sparkles className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5 tabular-nums">
                  {(summary.total_likes || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1 tabular-nums">
                  Avg {avgLikesPerPost.toLocaleString()} / post
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#B799E8]">
                <div className="text-[11px] font-bold text-[#19154E] flex items-center justify-between">
                  <span>LIVE COMMENTS</span>
                  <MessageCircle className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5 tabular-nums">
                  {(summary.total_comments || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1 tabular-nums">
                  Top: {(topByComments.comments || 0).toLocaleString()} comments
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                  <span>AVG ENGAGEMENT</span>
                  <Send className="w-4 h-4 text-[#FF7EB6]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#6D28D9] mt-1.5 tabular-nums">
                  {summary.avg_engagement_rate || 0}%
                </div>
                <div className="text-[11px] font-semibold text-neutral-600 mt-1 tabular-nums">
                  {typeof summary.total_followers_gained === 'number'
                    ? `+${summary.total_followers_gained.toLocaleString()} followers (API)`
                    : `(Likes + Comments) ÷ Views`}
                </div>
              </div>
            </div>

            {/* Connected Platforms Breakdown Grid (Clickable Cards — Zero Extra Buttons) */}
            {selectedPlatform === 'all' &&
              Array.isArray(analyticsData?.platform_breakdown) &&
              analyticsData.platform_breakdown.length > 0 && (
                <div className="editorial-card p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base sm:text-lg text-[#19154E] tabular-nums">
                      Connected Channels ({analyticsData.platform_breakdown.length})
                    </h3>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      Click any channel to filter
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {analyticsData.platform_breakdown.map((item) => {
                      const pMeta = PLATFORM_BY_ID[item.platform] || PLATFORM_BY_ID.instagram;
                      return (
                        <button
                          key={item.platform}
                          type="button"
                          onClick={() => setSelectedPlatform(pMeta.id)}
                          className="p-4 rounded-2xl bg-[#FFF8FC] hover:bg-white border-2 border-[#19154E] editorial-card-interactive text-left flex flex-col justify-between gap-3 group"
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-8 h-8 rounded-xl border-2 border-[#19154E] flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: pMeta.badgeBg,
                                  color: pMeta.badgeText,
                                }}
                              >
                                <PlatformIcon platform={pMeta.id} className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <div className="font-display font-bold text-sm text-[#19154E] truncate">
                                  {pMeta.name}
                                </div>
                                <div className="text-xs font-mono-code font-bold text-[#6D28D9] truncate">
                                  @{item.handle}
                                </div>
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-[#19154E] transition-colors shrink-0" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 text-center w-full tabular-nums">
                            <div>
                              <div className="text-[10px] font-bold uppercase text-neutral-500">
                                {pMeta.audienceLabel}
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(item.followers_count || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase text-neutral-500">
                                Views
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(item.total_views || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold uppercase text-neutral-500">
                                Likes
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(item.total_likes || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* ============================================================
                GOAL 1 & 2: LIVE POSTS / VIDEOS RANKING
                & COMPACT COLLAPSIBLE AI SUMMARIES
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-4 sm:p-5 border-b-2 border-[#19154E] bg-[#F5EEFF] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#19154E]">
                    {selectedPlatform === 'all'
                      ? 'Top Synced Videos & Posts'
                      : `Top ${activeContentLabel} on @${profile.username || 'your_account'}`}
                  </h3>
                  <p className="text-xs font-medium text-neutral-600">
                    Ranked by live {activePlatformLabel} telemetry with 1-click AI Strategy handoff.
                  </p>
                </div>

                {/* Sort Selector Segmented Control */}
                <div className="inline-flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#19154E]">
                  {[
                    { id: 'views', label: 'Views', activeBg: 'bg-[#C8F904] text-[#19154E]' },
                    { id: 'likes', label: 'Likes', activeBg: 'bg-[#FF7EB6] text-[#19154E]' },
                    { id: 'engagement', label: 'Engagement %', activeBg: 'bg-[#B799E8] text-[#19154E]' },
                    { id: 'recent', label: 'Newest', activeBg: 'bg-[#19154E] text-[#FFF8FC]' },
                    ...(hasFollowerInsights
                      ? [{ id: 'followers', label: '+Followers', activeBg: 'bg-[#FF7EB6] text-[#19154E]' }]
                      : []),
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVideoSortBy(opt.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors duration-150 ${
                        videoSortBy === opt.id
                          ? opt.activeBg
                          : 'text-[#19154E] hover:bg-[#F5EEFF]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5">
                {sortedPosts.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#FFF8FC] border-2 border-dashed border-[#19154E]/40 space-y-2">
                    <p className="font-display font-bold text-base text-[#19154E]">
                      {isUnconnected
                        ? 'No social accounts connected yet.'
                        : `Synced profile telemetry for @${profile.username} (${(profile.followers_count || 0).toLocaleString()} ${activeAudienceLabel.toLowerCase()}).`}
                    </p>
                    <p className="text-xs text-neutral-600 font-medium max-w-xl mx-auto">
                      {isUnconnected
                        ? 'Select Connections in the sidebar to link Instagram, TikTok, YouTube, Facebook, X, or Threads.'
                        : 'Public profile counts are live. Optional developer API tokens can be added in Connections → Advanced Setup if this platform restricts individual post feeds.'}
                    </p>
                  </div>
                ) : (
                  sortedPosts.map((post, idx) => {
                    const pMeta = PLATFORM_BY_ID[post.platform] || PLATFORM_BY_ID.instagram;
                    return (
                      <div
                        key={`${post.platform}-${post.id}`}
                        className={`rounded-2xl border-2 border-[#19154E] p-4 transition-colors duration-150 ${
                          idx === 0
                            ? 'bg-gradient-to-r from-[#FFF8FC] via-[#FFFDF9] to-[#F5EEFF] shadow-[4px_4px_0px_#19154E]'
                            : 'bg-white'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            {post.thumbnail_url && (
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="relative shrink-0 group"
                                title={`Open on ${pMeta.name}`}
                              >
                                <img
                                  src={post.thumbnail_url}
                                  alt={post.title}
                                  onError={(e) => {
                                    if (
                                      post.fallback_thumbnail_url &&
                                      e.currentTarget.src !== post.fallback_thumbnail_url &&
                                      !e.currentTarget.dataset.fallbackApplied
                                    ) {
                                      e.currentTarget.dataset.fallbackApplied = 'true';
                                      e.currentTarget.src = post.fallback_thumbnail_url;
                                    }
                                  }}
                                  className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-[#19154E] object-cover shadow-[2px_2px_0px_#19154E] bg-[#19154E] group-hover:scale-[1.02] transition-transform duration-150"
                                />
                                <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] tabular-nums font-extrabold px-1 py-0.5 rounded bg-[#19154E]/90 text-[#C8F904]">
                                  ▶ {(post.views || 0).toLocaleString()}
                                </span>
                              </a>
                            )}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-[#19154E] tabular-nums ${
                                    idx === 0
                                      ? 'bg-[#C8F904] text-[#19154E]'
                                      : idx === 1
                                      ? 'bg-[#FF7EB6] text-[#19154E]'
                                      : idx === 2
                                      ? 'bg-[#B799E8] text-[#19154E]'
                                      : 'bg-neutral-100 text-[#19154E]'
                                  }`}
                                >
                                  #{idx + 1}
                                </span>
                                <span
                                  className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border border-[#19154E] inline-flex items-center gap-1"
                                  style={{
                                    backgroundColor: pMeta.badgeBg,
                                    color: pMeta.badgeText,
                                  }}
                                >
                                  <PlatformIcon platform={pMeta.id} className="w-3 h-3" />
                                  <span>{pMeta.name}</span>
                                </span>
                                <span className="text-[11px] font-semibold text-neutral-500">
                                  {post.type || 'POST'} • {post.published_label}
                                  {post.duration_sec ? ` • ${post.duration_sec}s` : ''}
                                </span>
                                {post.best_keyword && !post.best_keyword.includes('None') && (
                                  <span className="font-mono-code text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C8F904] text-[#19154E] border border-[#19154E]">
                                    Keyword: &quot;{post.best_keyword}&quot;
                                  </span>
                                )}
                              </div>
                              <h4 className="font-display font-bold text-sm sm:text-base text-[#19154E] line-clamp-1">
                                {post.title}
                              </h4>
                              <p className="text-xs text-neutral-600 line-clamp-2">{post.caption}</p>
                            </div>
                          </div>

                          {/* Single Non-Duplicated Set of Live Performance Badges */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 tabular-nums">
                            <div className="px-3 py-1.5 rounded-xl bg-[#C8F904] border-2 border-[#19154E] text-center min-w-[72px]">
                              <div className="text-[10px] font-extrabold uppercase text-[#19154E]">
                                Views
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(post.views || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="px-3 py-1.5 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E] text-center min-w-[68px]">
                              <div className="text-[10px] font-extrabold uppercase text-[#19154E]">
                                Likes
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(post.likes || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="px-2.5 py-1.5 rounded-xl bg-[#F5EEFF] border-2 border-[#19154E] text-center min-w-[68px]">
                              <div className="text-[10px] font-bold uppercase text-[#6D28D9]">
                                Comments
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {(post.comments || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="px-2.5 py-1.5 rounded-xl bg-white border-2 border-[#19154E] text-center min-w-[64px]">
                              <div className="text-[10px] font-bold uppercase text-neutral-500">
                                Eng. %
                              </div>
                              <div className="font-display font-bold text-sm text-[#19154E]">
                                {post.engagement_rate}%
                              </div>
                            </div>

                            {typeof post.followers_gained === 'number' && (
                              <div className="px-2.5 py-1.5 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E] text-center">
                                <div className="text-[10px] font-bold uppercase text-[#6D28D9]">
                                  +Followers
                                </div>
                                <div className="font-display font-bold text-sm text-[#19154E]">
                                  +{post.followers_gained.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progressive Disclosure Footer: AI Summary + Single Action Strip */}
                        <div className="mt-3 pt-2.5 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <details open={idx === 0} className="flex-1 min-w-0 group">
                            <summary className="cursor-pointer select-none text-[11px] font-bold text-[#6D28D9] hover:text-[#19154E] inline-flex items-center gap-1">
                              <span>📝 AI Post Summary</span>
                              <span className="text-neutral-400 group-open:rotate-90 transition-transform">›</span>
                            </summary>
                            <p className="mt-1.5 text-xs text-[#19154E] font-medium leading-relaxed bg-[#FFF8FC] p-2.5 rounded-xl border border-[#19154E]/30">
                              {post.video_summary_text}
                            </p>
                          </details>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  `[${pMeta.name}] ${post.title}\nPermalink: ${post.permalink}\nViews: ${(post.views || 0).toLocaleString()} | Likes: ${(post.likes || 0).toLocaleString()} | Comments: ${(post.comments || 0).toLocaleString()} | ER: ${post.engagement_rate}%\nSummary: ${post.video_summary_text}`,
                                  `summary-${post.id}`
                                )
                              }
                              aria-label="Copy post summary"
                              title="Copy post summary"
                              className="px-2.5 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold text-[#19154E] hover:bg-[#EDE9FE] inline-flex items-center gap-1"
                            >
                              {copiedField === `summary-${post.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const customP = `Analyze this live ${pMeta.name} post "${post.title}" (${(post.views || 0).toLocaleString()} live views, ${(post.likes || 0).toLocaleString()} likes, ${(post.comments || 0).toLocaleString()} comments, ${post.engagement_rate}% engagement rate): ${post.video_summary_text} — Why did it perform this way and how can I replicate or repurpose it across my other platforms for my US audience?`;
                                setActiveTab('strategy');
                                handleRunOpenClaw(customP);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#19154E] text-[#FFF8FC] text-[11px] font-bold hover:bg-[#6D28D9] inline-flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-[#C8F904]" />
                              <span>Analyze</span>
                            </button>

                            {post.permalink && !post.thumbnail_url && (
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open post on ${pMeta.name}`}
                                className="px-2 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold text-[#19154E] hover:bg-[#C8F904] inline-flex items-center gap-1"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ============================================================
                GOAL 3: UNITED STATES (US) AUDIENCE ACTIVITY OBSERVATORY
                (Specifically isolating US followers vs. Global followers)
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 border-b-2 border-[#19154E] bg-gradient-to-r from-[#EDE9FE] via-[#FFF8FC] to-[#FFE4F1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8F904] border border-[#19154E] text-[11px] font-bold text-[#19154E] mb-1">
                    <span>🇺🇸 Goal #3: United States Audience Activity (Isolated from Global)</span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#19154E]">
                    When United States Followers Are Most Active (EST)
                  </h3>
                  <p className="text-xs font-medium text-neutral-700">
                    Peak US East &amp; West Coast scroll windows benchmarked for{' '}
                    <strong>@{profile.username || 'your_account'}</strong> (
                    <strong>{(profile.followers_count || 0).toLocaleString()}</strong> live followers).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#19154E]" />
                    🇺🇸 US Followers Active %
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B799E8]" />
                    🌍 All Global Followers %
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Key Diagnostic Callout */}
                <div className="p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs leading-relaxed font-medium text-[#19154E]">
                  <strong className="font-bold text-[#6D28D9]">🔎 US vs. Global Timing Insight: </strong>
                  {usActivity.key_insight}
                </div>

                {/* Optional Audience Demographics (Shown only when user connects their own Insights token) */}
                {usActivity.top_countries && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E] space-y-2">
                      <div className="text-xs font-extrabold uppercase text-[#19154E]">
                        🌍 Top Follower Countries (Instagram Insights)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {usActivity.top_countries.map((c) => (
                          <div
                            key={c.country}
                            className={`p-2.5 rounded-xl border border-[#19154E] flex items-center justify-between text-xs font-bold ${
                              c.country.includes('United States')
                                ? 'bg-[#C8F904] text-[#19154E]'
                                : 'bg-white text-[#19154E]'
                            }`}
                          >
                            <span>
                              {c.flag} {c.country}
                            </span>
                            <span>{c.share_pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] space-y-2">
                      <div className="text-xs font-extrabold uppercase text-[#19154E]">
                        👥 Follower Age &amp; Gender Split ({(profile.followers_count || 0).toLocaleString()} Live Followers)
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {(usActivity.age_ranges || []).slice(0, 4).map((a) => (
                          <span
                            key={a.range}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#19154E] text-[#19154E]"
                          >
                            Age {a.range}: <strong className="text-[#6D28D9]">{a.pct ?? a.share_pct}%</strong>
                          </span>
                        ))}
                        {usActivity.gender_split && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#FF7EB6] border border-[#19154E] text-[#19154E]">
                            Men {usActivity.gender_split.men_pct}% • Women {usActivity.gender_split.women_pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hourly EST Bar Comparison: US Active % vs Global Active % */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-sm text-[#19154E]">
                    Hourly Activity Breakdown (Eastern Time — EST/EDT)
                  </h4>
                  <div className="space-y-2.5">
                    {(usActivity.hourly_est || []).map((slot) => {
                      const isPeak = slot.us_active >= 85;
                      return (
                        <div
                          key={slot.hour}
                          className={`p-3 rounded-xl border-2 border-[#19154E] ${
                            isPeak ? 'bg-[#FFFDF9] shadow-[2px_2px_0px_#19154E]' : 'bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-code font-bold text-[#19154E] w-14">
                                {slot.hour} EST
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                  isPeak
                                    ? 'bg-[#C8F904] text-[#19154E] border border-[#19154E]'
                                    : 'text-neutral-600'
                                }`}
                              >
                                {slot.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-bold">
                              <span className="text-[#19154E]">
                                🇺🇸 US Active: <strong>{slot.us_active}%</strong>
                              </span>
                              <span className="text-neutral-500">
                                🌍 Global: {slot.global_active}%
                              </span>
                            </div>
                          </div>

                          {/* Dual Progress Bars */}
                          <div className="space-y-1">
                            <div className="w-full h-3 rounded-full bg-neutral-100 border border-[#19154E] overflow-hidden">
                              <div
                                className={`h-full ${
                                  isPeak ? 'bg-[#FF7EB6]' : 'bg-[#B799E8]'
                                }`}
                                style={{ width: `${slot.us_active}%` }}
                              />
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className="h-full bg-neutral-400"
                                style={{ width: `${slot.global_active}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3-Column Grid: Best US Posting Slots, Top US Cities, US Timezones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Column 1: Best US Posting Windows */}
                  <div className="p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      🎯 Best US Posting Windows (EST)
                    </h4>
                    <div className="space-y-2">
                      {(usActivity.best_us_slots || []).map((s) => (
                        <div
                          key={s.day}
                          className="p-2.5 rounded-xl bg-white border border-[#19154E] text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-[#19154E]">
                            <span>
                              {s.day} • {s.window_est}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#C8F904] text-[10px]">
                              {s.us_active_pct}% US Active
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-600 font-medium">{s.best_for}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Top United States Cities */}
                  <div className="p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      🏙️ Top United States Tech Hubs
                    </h4>
                    <div className="space-y-2">
                      {(usActivity.us_cities || []).map((c) => (
                        <div
                          key={c.city}
                          className="p-2.5 rounded-xl bg-white border border-[#19154E] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#19154E]">{c.city}</span>
                            <span className="ml-1.5 text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9]">
                              {c.tz}
                            </span>
                          </div>
                          <span className="font-display font-bold text-[#FF7EB6]">
                            {c.share_pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: US Follower Timezone Split */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      ⏰ US Follower Timezone Split
                    </h4>
                    <div className="space-y-2.5">
                      {(usActivity.us_timezones || []).map((tz) => (
                        <div key={tz.zone} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-[#19154E]">
                            <span>{tz.zone}</span>
                            <span>{tz.share_pct}% of US Followers</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white border border-[#19154E] overflow-hidden">
                            <div
                              className="h-full bg-[#FF7EB6]"
                              style={{ width: `${tz.share_pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 text-[11px] text-neutral-600 font-medium leading-relaxed">
                        💡 <strong>77% of your US audience</strong> lives in Eastern (EST) or Pacific (PST) timezones — posting at <strong>6:00 PM EST (3:00 PM PST)</strong> reaches both coasts while awake!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: OPENCLAW AGENT HUB & AI STRATEGY ENGINE
        ============================================================ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6 panel-enter">
            {/* ============================================================
                OPENCLAW AGENT HOOKUP & VIDEO SUMMARY ANALYZER
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 sm:p-6 border-b-2 border-[#19154E] bg-gradient-to-r from-[#FF7EB6]/25 via-[#F5EEFF] to-[#FFF8FC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#19154E] text-[#FFF8FC] text-[11px] font-bold">
                    <span>🦞 OpenClaw AI Strategy</span>
                    <span>•</span>
                    <span className="text-[#C8F904]">
                      {openclawStatus === 'connected_gateway' ? 'Live Gateway' : 'Ready'}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#19154E]">
                    AI Video Analyzer &amp; Growth Playbook
                  </h2>
                  <p className="text-xs text-neutral-600 max-w-2xl">
                    Analyzes your synced top posts and US audience scroll windows to generate next-post hooks and keyword DM triggers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBriefPreview(!showBriefPreview)}
                    className="editorial-btn px-3 py-1.5 rounded-xl bg-white text-[#19154E] text-xs font-bold"
                  >
                    {showBriefPreview ? 'Hide Data Brief' : '📄 View Data Brief'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(openclawBrief, 'openclaw-brief')}
                    className="editorial-btn px-3 py-1.5 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {copiedField === 'openclaw-brief' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Brief</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Optional Collapsible Raw Text Brief */}
                {showBriefPreview && (
                  <div className="p-4 rounded-2xl bg-[#19154E] text-[#FFF8FC] border-2 border-[#19154E] space-y-1.5">
                    <div className="text-xs font-bold text-[#C8F904]">
                      Compiled Live Telemetry + US Active Hours Brief:
                    </div>
                    <pre className="text-[11px] font-mono-code whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto text-neutral-200">
                      {openclawBrief}
                    </pre>
                  </div>
                )}

                {/* Agent Prompt & Quick Task Pills */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-[#19154E] mr-1">Prompts:</span>
                    {[
                      {
                        short: 'Compare top 3 posts & write 3 scripts',
                        full: 'Compare my top 3 live Reels by Views & Engagement Rate and write 3 new Reel scripts',
                      },
                      {
                        short: 'Why #1 post won + Part 2 sequel',
                        full: 'Why did my #1 live Reel outperform my account average, and how do I build a Part 2 sequel?',
                      },
                      {
                        short: '7-day US posting schedule (EST/PST)',
                        full: 'Build a 7-day US Audience posting schedule (EST & PST) from my live Reel stats',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.short}
                        type="button"
                        onClick={() => handleRunOpenClaw(preset.full)}
                        className="px-3 py-1 rounded-xl bg-[#F5EEFF] hover:bg-[#FF7EB6] border border-[#19154E] text-[11px] font-bold text-[#19154E] transition-colors duration-150"
                      >
                        ✨ {preset.short}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={openclawPrompt}
                      onChange={(e) => setOpenclawPrompt(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs sm:text-sm font-semibold text-[#19154E]"
                      placeholder="Ask OpenClaw anything about your post metrics or US audience..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRunOpenClaw()}
                      disabled={openclawStatus === 'running'}
                      className="editorial-btn px-5 py-2.5 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {openclawStatus === 'running' ? 'Analyzing...' : 'Run Analysis'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* OpenClaw Agent Analysis Output */}
                <div className="p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] shadow-[4px_4px_0px_#19154E] space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-neutral-200 pb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">
                      🦞 Analysis Output
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(openclawOutput, 'openclaw-output')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold text-[#19154E]"
                    >
                      {copiedField === 'openclaw-output' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-[#19154E] whitespace-pre-wrap leading-relaxed font-medium">
                    {openclawOutput}
                  </div>
                </div>

                {/* Progressive Disclosure for Developer Gateway / Feed URLs */}
                <details className="pt-1 text-xs">
                  <summary className="cursor-pointer select-none font-bold text-neutral-500 hover:text-[#19154E]">
                    ⚙️ Custom OpenClaw Gateway &amp; Telemetry Feed URL (Optional)
                  </summary>
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E]">
                    <div className="lg:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase text-[#19154E] mb-1">
                        OpenClaw Gateway Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={openclawGatewayUrl}
                        onChange={(e) => setOpenclawGatewayUrl(e.target.value)}
                        placeholder="http://localhost:18789/v1/chat/completions"
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code font-bold text-[#6D28D9]"
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase text-[#19154E] mb-1">
                        Live Telemetry Feed URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/analytics`}
                          className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code font-bold text-[#19154E]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/analytics`,
                              'brief-url'
                            )
                          }
                          className="px-3 py-2 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E] text-xs font-bold text-[#19154E]"
                        >
                          {copiedField === 'brief-url' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#19154E]">
                Growth &amp; DM Conversion Playbook {profile.username ? `for @${profile.username}` : ''}
              </h3>
              <p className="text-xs text-neutral-600 font-medium">
                Turn any strategy card directly into an active keyword DM flow.
              </p>
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {strategies.map((strat, index) => (
                <div
                  key={strat.id}
                  className="editorial-card editorial-card-interactive p-5 bg-white flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border-2 border-[#19154E] ${
                          index % 2 === 0 ? 'bg-[#C8F904]' : 'bg-[#B799E8]'
                        }`}
                      >
                        {strat.category}
                      </span>
                      <span className="text-xs font-extrabold text-[#FF7EB6]">
                        ⚡ {strat.impact}
                      </span>
                    </div>

                    <h4 className="font-display text-lg sm:text-xl font-bold text-[#19154E]">
                      {strat.title}
                    </h4>

                    <p className="text-xs text-[#19154E] bg-[#FFF8FC] p-3 rounded-2xl border-2 border-[#19154E] font-medium leading-relaxed">
                      📊 <strong>Why it works:</strong> {strat.finding}
                    </p>

                    <ul className="space-y-1.5 text-xs text-neutral-800 font-medium pt-0.5">
                      {strat.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#6D28D9] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3.5 border-t-2 border-dashed border-neutral-300 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-neutral-600">
                      Keyword:{' '}
                      <strong className="font-mono-code px-2 py-0.5 rounded bg-[#EDE9FE] border border-[#19154E] text-[#6D28D9]">
                        &quot;{strat.recommended_keyword}&quot;
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyStrategyKeyword(strat.recommended_keyword, strat.title)
                      }
                      className="editorial-btn px-3.5 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#C8F904]" />
                      <span>Build DM Flow</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Next 3 High-Converting Reel & Carousel Ideas */}
            <div className="editorial-card p-5 sm:p-6 bg-[#EDE9FE] space-y-4">
              <div>
                <h4 className="font-display text-lg sm:text-xl font-bold text-[#19154E]">
                  Next 3 Content Hooks + Paired DM Keywords
                </h4>
                <p className="text-xs font-medium text-neutral-700">
                  Tailored for @{profile.username || 'your_account'}&apos;s audience and content pillars:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contentIdeas.map((idea, i) => (
                  <div
                    key={i}
                    className="editorial-card-sm p-4 bg-white flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#FF7EB6] text-[#19154E] border border-[#19154E]">
                          {idea.format}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#C8F904] border border-[#19154E]">
                          Est. ER: {idea.predicted_er}
                        </span>
                      </div>
                      <h5 className="font-display font-bold text-base text-[#19154E]">
                        {idea.title}
                      </h5>
                      <p className="text-xs text-neutral-700 italic bg-[#FFF8FC] p-2.5 rounded-xl border border-neutral-300">
                        <strong>Hook:</strong> &quot;{idea.hook}&quot;
                      </p>
                    </div>
                    <div className="pt-2.5 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-600">
                        Keyword:{' '}
                        <strong className="font-mono-code text-[#6D28D9]">
                          {idea.cta_keyword}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyStrategyKeyword(idea.cta_keyword, idea.title)}
                        className="text-xs font-bold text-[#6D28D9] hover:underline"
                      >
                        + Create Trigger →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: MULTI-PLATFORM 1-BUTTON CONNECT & REDIRECT HUB
            (Instagram, TikTok, YouTube, Facebook, X, Threads)
        ============================================================ */}
        {activeTab === 'connect' && (
          <div className="max-w-3xl mx-auto space-y-5 panel-enter">
            <div className="editorial-card p-5 sm:p-7 bg-white space-y-5">
              <div className="flex items-center justify-between gap-4 border-b-2 border-[#19154E] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8F904] border border-[#19154E] text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Isolated Workspace</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDE9FE] border border-[#19154E] text-[11px] font-bold text-[#6D28D9] tabular-nums">
                      <span>{connectedPlatformIds.length} of 6 Connected</span>
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                    Connect Social Accounts
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                    Select a channel, paste your <strong>@handle</strong> or profile link, and click once to pull live stats.
                  </p>
                </div>
                <div className="hidden sm:flex w-20 h-16 shrink-0 items-center justify-center">
                  <PlugMechanicCharacter connected={connectedPlatformIds.length > 0} />
                </div>
              </div>

              {/* 6-Platform Selector Grid */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-neutral-600">
                  1. Choose Platform
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PLATFORMS.map((plat) => {
                    const conn = connectionsMap[plat.id];
                    const isSelected = connectPlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        data-testid={`select-platform-${plat.id}`}
                        onClick={() => handleSelectConnectPlatform(plat.id)}
                        className={`p-3 rounded-2xl border-2 border-[#19154E] text-left transition-all duration-150 flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#FFFDF9] shadow-[3px_3px_0px_#19154E] -translate-y-0.5 ring-2 ring-[#FF7EB6]'
                            : conn?.handle
                            ? 'bg-[#F5EEFF]/60 hover:bg-white'
                            : 'bg-white hover:bg-[#FFF8FC]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-8 h-8 rounded-xl border-2 border-[#19154E] flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: plat.badgeBg,
                              color: plat.badgeText,
                            }}
                          >
                            <PlatformIcon platform={plat.id} className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-display font-bold text-sm text-[#19154E] truncate">
                              {plat.name}
                            </div>
                            <div
                              className={`text-[11px] font-bold truncate ${
                                conn?.handle ? 'text-emerald-700 font-mono-code' : 'text-neutral-500'
                              }`}
                            >
                              {conn?.handle
                                ? conn.has_access_token
                                  ? `⚡ @${conn.handle}`
                                  : `● @${conn.handle}`
                                : oauthProviders[plat.id]
                                ? '⚡ 1-Click Ready'
                                : 'Not connected'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {connectStatusMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold border-2 border-[#19154E] ${
                    connectStatusMsg.type === 'error'
                      ? 'bg-[#FF7EB6] text-[#19154E]'
                      : 'bg-[#C8F904] text-[#19154E]'
                  }`}
                >
                  {connectStatusMsg.text}
                </div>
              )}

              {/* Single Unified Connect & Redirect Form for Selected Platform */}
              <form onSubmit={handleConnectAndRedirect} className="space-y-4">
                {connectMeta.id === 'threads' && connectionsMap.instagram?.handle && (
                  <div className="p-4 rounded-2xl bg-[#EDE9FE] border-2 border-[#19154E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs font-bold text-[#19154E]">
                      <span className="inline-flex items-center gap-1.5 text-[#6D28D9]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Instagram ↔ Threads Auto-Sync</span>
                      </span>
                      <p className="text-[11px] font-medium text-neutral-700 mt-0.5">
                        {connectionsMap.threads?.handle?.toLowerCase() ===
                        connectionsMap.instagram.handle.toLowerCase()
                          ? `Your Threads account @${connectionsMap.threads.handle} is automatically linked through your connected Instagram.`
                          : `Instagram @${connectionsMap.instagram.handle} is connected — link your matching Threads account automatically in one click:`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncing}
                      data-testid="auto-connect-threads-ig-btn"
                      onClick={handleAutoConnectThreadsFromInstagram}
                      className="editorial-btn px-4 py-2 rounded-xl bg-[#B799E8] text-[#19154E] text-xs font-bold shrink-0"
                    >
                      {connectionsMap.threads?.handle?.toLowerCase() ===
                      connectionsMap.instagram.handle.toLowerCase()
                        ? `Re-Sync @${connectionsMap.instagram.handle} Threads`
                        : `✨ Auto-Connect @${connectionsMap.instagram.handle}`}
                    </button>
                  </div>
                )}

                <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-display font-bold text-[#19154E] flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-lg border border-[#19154E] inline-flex items-center justify-center"
                        style={{
                          backgroundColor: connectMeta.badgeBg,
                          color: connectMeta.badgeText,
                        }}
                      >
                        <PlatformIcon platform={connectMeta.id} className="w-3.5 h-3.5" />
                      </span>
                      <span>
                        2. {connectMeta.name} Profile Link or @Handle
                        {oauthProviders[connectMeta.id] ? ' (Optional with 1-Click OAuth)' : ''}
                      </span>
                    </label>
                    {connectionsMap[connectMeta.id]?.handle && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8F904] border border-[#19154E] text-[#19154E]">
                        {connectionsMap[connectMeta.id]?.has_access_token
                          ? `⚡ Auto-Post: @${connectionsMap[connectMeta.id].handle}`
                          : `Connected: @${connectionsMap[connectMeta.id].handle}`}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required={!oauthProviders[connectMeta.id]}
                    data-testid="platform-handle-input"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder={connectMeta.placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#19154E] text-sm font-bold text-[#19154E] focus:outline-none"
                  />
                  <p className="text-xs text-neutral-600 font-medium">
                    {extractHandleForPlatform(handleInput) ? (
                      <>
                        Detected {connectMeta.name} account:{' '}
                        <strong className="font-mono-code text-[#6D28D9]">
                          {/^https?:\/\//i.test(extractHandleForPlatform(handleInput))
                            ? 'Share link (will auto-resolve @handle)'
                            : `@${extractHandleForPlatform(handleInput)}`}
                        </strong>
                      </>
                    ) : handleInput.trim() ? (
                      <span className="text-rose-700 font-bold">
                        {explainInvalidHandleInput(handleInput, connectMeta.name)}
                      </span>
                    ) : (
                      <>
                        Detected {connectMeta.name} account:{' '}
                        <strong className="font-mono-code text-[#6D28D9]">
                          {oauthProviders[connectMeta.id]
                            ? `1-Click OAuth ready — click below or enter @handle`
                            : `Enter your ${connectMeta.name} @handle above`}
                        </strong>
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={syncing}
                  data-testid="single-connect-btn"
                  className="w-full editorial-btn py-3.5 px-6 rounded-2xl bg-[#C8F904] text-[#19154E] font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2.5"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>
                        Connecting to {connectMeta.name} &amp; Pulling Live Stats...
                      </span>
                    </>
                  ) : (
                    <>
                      <PlatformIcon platform={connectMeta.id} className="w-5 h-5" />
                      <span>
                        {oauthProviders[connectMeta.id]
                          ? `Connect & Authorize ${connectMeta.name} (Pull Stats) ↗`
                          : `Connect to ${connectMeta.name} & Pull Stats ↗`}
                      </span>
                    </>
                  )}
                </button>

                {connectionsMap[connectMeta.id]?.handle && (
                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(connectMeta.id);
                        setActiveTab('analytics');
                      }}
                      className="text-xs font-bold text-[#6D28D9] hover:underline"
                    >
                      View @{connectionsMap[connectMeta.id].handle} Overview →
                    </button>
                    <button
                      type="button"
                      data-testid={`disconnect-platform-${connectMeta.id}`}
                      onClick={() => handleDisconnectPlatform(connectMeta.id)}
                      className="text-xs font-bold text-neutral-500 hover:text-rose-600 underline"
                    >
                      Disconnect @{connectionsMap[connectMeta.id].handle}
                    </button>
                  </div>
                )}
              </form>

              {/* Optional Collapsed Advanced Section (Hidden by Default) */}
              <details className="pt-2 border-t border-neutral-200 text-xs">
                <summary className="cursor-pointer font-bold text-neutral-500 hover:text-[#19154E] select-none py-1">
                  ⚙️ App Owner 1-Click OAuth &amp; Advanced Token Setup (Optional)
                </summary>
                <form
                  onSubmit={handleConnectSubmit}
                  className="mt-4 space-y-4 p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E]"
                >
                  <div className="p-3 rounded-xl bg-white border border-[#19154E] space-y-1.5">
                    <div className="font-bold text-[#19154E]">
                      ⚡ 1-Click OAuth Redirect URI (Add once in Meta / TikTok / Google / X Developer App):
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          oauthRedirectUri ||
                          `${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/oauth`
                        }
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#FFF8FC] border border-[#19154E] font-mono-code text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            oauthRedirectUri ||
                              `${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/oauth`,
                            'oauth-redirect-uri'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#C8F904] border border-[#19154E] font-bold text-[11px]"
                      >
                        {copiedField === 'oauth-redirect-uri' ? 'Copied!' : 'Copy URI'}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      Set your platform&apos;s Client ID &amp; Secret once in Vercel Environment Variables (e.g.{' '}
                      <code className="font-mono-code">INSTAGRAM_APP_ID</code>,{' '}
                      <code className="font-mono-code">TIKTOK_CLIENT_KEY</code>,{' '}
                      <code className="font-mono-code">GOOGLE_CLIENT_ID</code>,{' '}
                      <code className="font-mono-code">FACEBOOK_APP_ID</code>,{' '}
                      <code className="font-mono-code">X_CLIENT_ID</code>) and every user gets 1-Click OAuth auto-publishing!
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      {connectMeta.tokenLabel}
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={connectMeta.tokenPlaceholder}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                    />
                  </div>
                  {connectMeta.id === 'instagram' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#19154E] mb-1">
                          Optional Meta App ID
                        </label>
                        <input
                          type="text"
                          value={appIdInput}
                          onChange={(e) => setAppIdInput(e.target.value)}
                          placeholder="App ID"
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#19154E] mb-1">
                          Optional Meta App Secret
                        </label>
                        <input
                          type="password"
                          value={appSecretInput}
                          onChange={(e) => setAppSecretInput(e.target.value)}
                          placeholder="App Secret"
                          className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="editorial-btn px-4 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold"
                  >
                    Save {connectMeta.name} API Token
                  </button>
                </form>
              </details>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

function intOrZero(val) {
  return Math.round(val || 0);
}
