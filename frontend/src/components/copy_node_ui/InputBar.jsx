import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { TOKENS } from "../../tokens.js";
import { tokenizePrompt } from "../../utils/promptPlaceholders";
// Stubbed/dummy definitions for missing dependencies
const callBackendChatStream = async (text, convId, currentFiles, currentPromptTitle, abortSignal, selectedLLM, userId, userName, teamId, messages, disableBrandVoice, onChunk) => {
  const payload = {
    user_message: text,
    promptTitle: currentPromptTitle,
    llm_model: selectedLLM,
    temperature: 0.7,
    stream: true,
    conversation_id: convId,
    attached_files: currentFiles ? currentFiles.map(f => ({ name: f.name, type: f.type, data: f.data })) : [],
    external_project_data: {},
    messages: messages ? messages.map(m => ({
      role: m.role,
      content: m.text || m.content || '',
      text: m.text || m.content || ''
    })) : []
  };

  const response = await fetch('/bff/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: abortSignal
  });

  if (!response.ok) throw new Error('Failed to fetch stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  let conversationId = convId;
  let messageId = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.error) throw new Error(parsed.error);
        
        if (parsed.chunk) {
          fullText += parsed.chunk;
          if (onChunk) onChunk(parsed.chunk, fullText);
        }

        // Hydrate from new `files` dictionary if present
        if (parsed.files) {
          let extractedFilesText = "";
          for (const cat in parsed.files) {
            if (Array.isArray(parsed.files[cat])) {
              for (const f of parsed.files[cat]) {
                if (f.content) extractedFilesText += f.content + "\n\n";
              }
            }
          }
          if (extractedFilesText.trim()) {
            fullText = extractedFilesText.trim();
            if (onChunk) onChunk(fullText, fullText); // Override UI with final file contents
          }
        }

        if (parsed.status === 'done' || parsed.status === 'SUCCESS' || parsed.conversation_id) {
          if (parsed.conversation_id) conversationId = parsed.conversation_id;
          if (parsed.messageId) messageId = parsed.messageId;
        }
      } catch (e) {
        throw e;
      }
    }
  }
  return { content: fullText, conversationId, messageId };
};
const enhancePrompt = async (text) => {
  try {
    const payload = {
      user_message: `You are an expert prompt engineer. Your goal is to improve the following prompt to be more clear, detailed, and effective for an AI. Return ONLY the improved prompt text, nothing else. Do not add quotes around it. Here is the prompt:\n\n${text}`,
      llm_model: "claude-4-sonnet",
      temperature: 0.7,
      stream: false,
      conversation_id: null
    };

    const response = await fetch('/bff/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return text;
    const result = await response.json();
    if (result.assistant_message) {
      return result.assistant_message.trim();
    }
    return text;
  } catch (err) {
    console.error("Failed to enhance prompt:", err);
    return text;
  }
};
const createConversation = async (title, teamId, userId, projectId) => {
  try {
    const response = await fetch('/bff/chat/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        team_id: teamId,
        user_id: userId,
        brand_id: projectId
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error("Failed to create conversation:", err);
    return { id: "conv_" + Math.random().toString(36).substr(2, 9) };
  }
};
const startVariantSession = async (payload) => {
  const resp = await fetch('/bff/chat/variants/compare', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error("Failed to start variant session");
  return resp.json();
};
const pollVariantSession = async (sessionId) => {
  const resp = await fetch(`/bff/chat/variants/${sessionId}`);
  if (!resp.ok) throw new Error("Failed to poll variant session");
  return resp.json();
};
const API_BASE_URL = "";
const getFileIcon = () => "";
// tokenizePrompt imported at top
const useProject = () => ({ currentProject: null });
const toPascalCase = (s) => s;
const autoFillPrompt = (t) => ({ filledPrompt: t, replacements: [] });
const hasAutoFillablePlaceholders = () => false;
const Tooltip = ({ children }) => children;
const VoiceInput = () => null;
const debounce = (f) => f;
const getAutocompleteSuggestions = async () => [];
const analyzeGenerationMode = () => ({});
const isGenerationRequest = () => false;

const LLM_OPTIONS = [
  { id: "claude-4-sonnet", label: "Claude Sonnet 5" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" }
];

// Add fade animation styles
if (!document.querySelector('#empty-state-animation')) {
  const style = document.createElement('style');
  style.id = 'empty-state-animation';
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatingSlow {
      0%, 100% { transform: translateY(0px) scale(1); }
      50%       { transform: translateY(-5px) scale(1.01); }
    }
    @keyframes shineEffect {
      0%   { left: -100%; }
      100% { left: 100%; }
    }
    @keyframes pdfGlow {
      0%, 100% { box-shadow: 0 0 6px 1px rgba(34,197,94,0.5); }
      50%       { box-shadow: 0 0 14px 4px rgba(34,197,94,0.85); }
    }
  `;
  document.head.appendChild(style);
}
const InputBar = forwardRef(function InputBar({
  onSendMessage,
  onAddStatus: propOnAddStatus,
  onOpenPromptsModal,
  onNavigateToPrompts,
  onOpenBrandVoiceModal,
  onOpenFilePreview,
  currentConversationId,
  onConversationIdChange,
  onSelectPrompt,
  isProcessing,
  onStopProcessing,
  onSetDefaultView,
  messages,
  selectedLLM,
  onLLMChange,
  currentTeam,
  isSoftLocked,
  isTrialLocked,
  isPlanExpiredLocked,
  setIsProcessing,
  onUpdateLastMessage,
  onUpdateLastMessageId,
  currentCampaign,
  hiddenLLMModels = "",
  
}, ref) {
  const onAddStatus = propOnAddStatus || (() => {});
  const activeTheme = (() => {
    try {
      const mode = localStorage.getItem("studio-theme") || "light";
      return TOKENS[mode];
    } catch (_) {
      return TOKENS.light;
    }
  })();

  const [promptTitle, setPromptTitle] = useState(""); // Track selected prompt
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareModels, setSelectedCompareModels] = useState(['claude-4-sonnet']);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [userInput, setUserInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [hasStartedWork, setHasStartedWork] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [selectedPlaceholderIndex, setSelectedPlaceholderIndex] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(null); // {current, total, filename}
  const [uploadError, setUploadError] = useState('');
  const [contextWindowWarning, setContextWindowWarning] = useState(false);

  // 🔥 Sync isStopping with parent isProcessing state
  useEffect(() => {
    if (!isProcessing && isStopping) {
      setIsStopping(false);
    }
  }, [isProcessing, isStopping]);

  // Clear uploadError after 5 seconds
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => {
        setUploadError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [ghostSuggestion, setGhostSuggestion] = useState(''); // 🔥 Ghost text (Copilot-style)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [showTemplates, setShowTemplates] = useState(true);


  const textareaRef = useRef(null);
  const ghostRef = useRef(null);
  const highlightBackdropRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const plusMenuRef = useRef(null);
  const { currentProject } = useProject(); // 🔥 USE CONTEXT

  // Clear input composer state when switching conversation or project
  const prevConversationIdRef = useRef(currentConversationId);
  const prevProjectIdRef = useRef(currentProject?.id);

  useEffect(() => {
    // Only clear input if conversation or project actually changed (prevents clearing on initial mount)
    if (prevConversationIdRef.current !== currentConversationId || prevProjectIdRef.current !== currentProject?.id) {
      setUserInput('');
      setPromptTitle('');
      setAttachedFiles([]);
      setTokens([]);
      setSuggestions([]);
      setGhostSuggestion('');
    }
    prevConversationIdRef.current = currentConversationId;
    prevProjectIdRef.current = currentProject?.id;
  }, [currentConversationId, currentProject?.id]);

  const [deepResearchEnabled, setDeepResearchEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false); // 🔥 Synchronous guard (refs update instantly, unlike state)
  const vibeChosenForChatRef = useRef(false); // 🔥 Vibe confirmed once per conversation — don't re-ask
  const pendingSubmitRef = useRef(null); // { text, files, title } for external submissions (home/pending prompt)
  const [showEmptyState, setShowEmptyState] = useState(true);

  // @ Mention states
  const [libraryDocuments, setLibraryDocuments] = useState([]);
  const [mentionFilteredDocs, setMentionFilteredDocs] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // ── Compare LLMs State ─────────────────────────────────────────────────────
  const [isComparing, setIsComparing] = useState(false); // button loading state
  const variantPollRef = useRef(null);                   // holds setInterval id
  const variantPollCountRef = useRef(0);                 // guard against infinite poll
  const MAX_POLLS = 90;                                  // 90 × 2.5s = ~3.5 min max
  // ── Resume polling if a session was still running when the page reloaded ────
  // Note: the variant card itself is restored by handleLoadConversation in App.jsx.
  // This effect only resumes the polling interval if variants are still generating.
  useEffect(() => {
    const savedConvId = localStorage.getItem('currentConversationId');
    if (!savedConvId) return;
    const key = `variantSession_${savedConvId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return;
    try {
      const { sessionId } = JSON.parse(saved);
      if (!sessionId) return;
      const variantMsgId = `variants-${sessionId}`;

      // Wait for App.jsx to finish injecting the card (handleLoadConversation is async)
      setTimeout(async () => {
        try {
          const poll = pollVariantSession;
          const data = await poll(sessionId);
          const stillRunning = data.variants.some(
            v => v.status === 'pending' || v.status === 'generating'
          ) && data.status !== 'done' && data.status !== 'failed';

          if (stillRunning) {
            setIsComparing(true);
            if (setIsProcessing) setIsProcessing(true);
            _startPoll(sessionId, variantMsgId);
          } else {
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.warn('Could not resume variant poll:', e);
          localStorage.removeItem(key);
        }
      }, 2000); // 2s: enough for handleLoadConversation to finish
    } catch (e) {
      console.warn('Bad variant session in localStorage', e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount


  // Derive active brand voice label from project context
  const hasBrandVoice = currentProject?.brand_voice_status && currentProject.brand_voice_status !== 'not_set';
  const brandVoiceLabel = hasBrandVoice
    ? (toPascalCase(currentProject.brand_name || currentProject.name) || 'Brand Voice')
    : 'No Brand Voice';

  const [brandVoiceEnabled, setBrandVoiceEnabled] = useState(true);
  const [showModeChooser, setShowModeChooser] = useState(false);
  const [pendingPromptTitleForModeChooser, setPendingPromptTitleForModeChooser] = useState(""); // 🔥 Store prompt title when mode chooser appears

  useEffect(() => {
    setTokens(tokenizePrompt(userInput || ''));
  }, [userInput]);

  useEffect(() => {
    // Hide empty state when user starts typing or attaches files
    if (userInput.trim() || attachedFiles.length > 0) {
      setShowEmptyState(false);
    }
  }, [userInput, attachedFiles]);

  useEffect(() => {
    if (showMentionDropdown) {
      const filtered = libraryDocuments.filter(doc =>
        doc.name.toLowerCase().includes(mentionSearchText.toLowerCase())
      );
      setMentionFilteredDocs(filtered);
      setActiveMentionIndex(0);
    } else {
      setMentionFilteredDocs([]);
    }
  }, [mentionSearchText, libraryDocuments, showMentionDropdown]);

  // Debounced autocomplete trigger
  const debouncedAutocomplete = useRef(
    debounce(async (text) => {
      if (text.trim().endsWith('.')) {
        setIsLoadingSuggestions(true);
        const newSuggestions = await getAutocompleteSuggestions(text);
        setSuggestions(newSuggestions);
        // 🔥 Show the first suggestion as ghost text
        setGhostSuggestion(newSuggestions.length > 0 ? newSuggestions[0] : '');
        setSelectedSuggestionIndex(0);
        setIsLoadingSuggestions(false);
      } else {
        setSuggestions([]);
        setGhostSuggestion('');
      }
    }, 500)
  ).current;

  // Handle prompt selection from PromptsModal - ALREADY EXISTS, NO CHANGE
  const handlePromptSelect = (description, title) => {
    let finalPrompt = description;
    const activeProject = currentProject;
    if (activeProject) {
      const { filledPrompt } = autoFillPrompt(description, activeProject, currentCampaign);
      finalPrompt = filledPrompt;
    }
    setUserInput(finalPrompt);
    setPromptTitle(title);
    console.log('🎯 Prompt selected - Title:', title);
    console.log('🎯 Prompt selected - Description:', finalPrompt);

    // 🔥 Multiple resize attempts with delays
    [0, 50, 150, 300].forEach(delay => {
      setTimeout(() => {
        adjustHeight();
      }, delay);
    });
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      let targetHeight = textareaRef.current.scrollHeight;
      if (ghostSuggestion && ghostRef.current) {
        const ghostHeight = ghostRef.current.scrollHeight;
        if (ghostHeight > targetHeight) {
          targetHeight = ghostHeight;
        }
      }
      textareaRef.current.style.height = `${targetHeight}px`;
    }
  };

  const handleScroll = (e) => {
    if (ghostRef.current) {
      ghostRef.current.scrollTop = e.target.scrollTop;
    }
    if (highlightBackdropRef.current) {
      highlightBackdropRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleTextareaClick = (e) => {
    const textarea = e.target;
    const clickPos = textarea.selectionStart;
    const currentTokens = tokenizePrompt(textarea.value);
    
    let startPos = 0;
    for (let i = 0; i < currentTokens.length; i++) {
      const token = currentTokens[i];
      const length = token.value.length;
      if (token.type === 'placeholder') {
        if (clickPos >= startPos && clickPos <= startPos + length) {
          textarea.setSelectionRange(startPos, startPos + length);
          break;
        }
      }
      startPos += length;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [userInput, ghostSuggestion]);

  // Expose handlePromptSelect to parent via onSelectPrompt
  useEffect(() => {
    if (onSelectPrompt) {
      onSelectPrompt.current = handlePromptSelect;
    }
  }, [onSelectPrompt]);

  // NEW: Function to manually trigger re-recommendation
  const handleRecommendMore = async () => {
    if (!userInput.trim().endsWith('.')) {
      onAddStatus("Please end your prompt with a period (.) to get suggestions");
      return;
    }

    // Instantly clear old suggestions before loading new ones
    setSuggestions([]);
    setIsLoadingSuggestions(true);
    onAddStatus("🔄 Getting fresh suggestions...");

    try {
      const newSuggestions = await getAutocompleteSuggestions(userInput);
      setSuggestions(newSuggestions);
      setSelectedSuggestionIndex(0);
      onAddStatus("✓ New suggestions loaded");
    } catch (error) {
      onAddStatus("Error getting suggestions: " + error.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = async (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    let imageFiles = [];

    // 1. Check files list (most direct for copied file explorer files and modern screenshot paste)
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file && file.type && file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }
    }

    // 2. If files list didn't yield anything, try items list (traditional clipboard data)
    if (imageFiles.length === 0 && clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item && item.kind === 'file' && item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault(); // Stop default text paste for the images
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const timestamp = Date.now();
        const ext = (file.type && file.type.split('/')[1]) || 'png';
        const fileName = file.name && file.name !== 'image.png' ? file.name : `screenshot_${timestamp}_${i}.${ext}`;
        const renamedFile = new File([file], fileName, { type: file.type });

        try {
          const fileData = await readFileAsBase64(renamedFile);
          setAttachedFiles(prev => [...prev, {
            name: renamedFile.name,
            type: renamedFile.type,
            size: renamedFile.size,
            data: fileData
          }]);
          onAddStatus(`✓ Attached pasted image: ${renamedFile.name}`);
        } catch (err) {
          console.error("Paste error:", err);
          onAddStatus(`✗ Failed to attach pasted image`);
        }
      }
    }
  };

  const handleFileChange = async (e) => {
    setUploadError(''); // Clear previous error
    const files = Array.from(e.target.files);

    if (attachedFiles.length + files.length > 10) {
      setUploadError('Maximum file limit reached: You can attach up to 10 files per message.');
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (file.size > 30 * 1024 * 1024) {
         setUploadError(`File size limit exceeded: "${file.name}" exceeds the maximum 30MB limit.`);
         continue;
      }
      
      if (file.type === 'application/pdf') {
         try {
           const text = await file.text();
           const pageCount = (text.match(/\/Type\s*\/Page\b/g) || []).length;
           if (pageCount > 20) {
              setUploadError(`Page limit exceeded: "${file.name}" exceeds 20 pages. Please compress or pass only relevant context.`);
              continue;
           }
         } catch (err) {
           console.warn("Could not check PDF page count:", err);
         }
      }

      try {
        const fileData = await readFileAsBase64(file);
        setAttachedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: fileData
        }]);
        onAddStatus(`✓ Attached: ${file.name}`);
      } catch (err) {
        onAddStatus(`✗ Failed to attach ${file.name}`);
      }
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    onAddStatus("File removed");
  };

  const loadLibraryDocuments = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}/api/library/documents`, {
        headers: {
          'X-User-Id': userId || '',
          'X-Team-Id': currentTeam?.id || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLibraryDocuments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load library documents for mention:', error);
    }
  };

  const getMimeTypeForExtension = (ext) => {
    if (!ext) return 'text/plain';
    const mimeTypes = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'ppt': 'application/vnd.ms-powerpoint',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'md': 'text/markdown'
    };
    return mimeTypes[ext.toLowerCase()] || 'text/plain';
  };

  const selectDocumentForAttachment = async (doc) => {
    try {
      onAddStatus(`Attaching document: ${doc.name}...`);
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}/api/library/documents/${doc.id}`, {
        headers: { 'X-User-Id': userId || '' }
      });
      if (!response.ok) throw new Error('Failed to fetch document content');

      const fullDoc = await response.json();
      const isBinary = ['pdf', 'docx', 'pptx', 'xlsx', 'ppt', 'doc', 'xls', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fullDoc.format?.toLowerCase());
      
      let attachedData = fullDoc.content;
      if (!isBinary && typeof attachedData === 'string') {
        attachedData = btoa(unescape(encodeURIComponent(attachedData)));
      }

      const newAttachment = {
        name: `${fullDoc.name}.${fullDoc.format || 'txt'}`,
        type: getMimeTypeForExtension(fullDoc.format),
        size: fullDoc.size || attachedData.length,
        data: attachedData
      };

      setAttachedFiles(prev => [...prev, newAttachment]);
      
      if (textareaRef.current) {
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = userInput.substring(0, cursorPosition);
        const lastAtIdx = textBeforeCursor.lastIndexOf('@');
        
        const textAfterCursor = userInput.substring(cursorPosition);
        const nextText = userInput.substring(0, lastAtIdx) + textAfterCursor;
        setUserInput(nextText);
        
        setTimeout(() => {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(lastAtIdx, lastAtIdx);
          adjustHeight();
        }, 0);
      }

      onAddStatus(`✓ Attached "${doc.name}" from library`);
      setShowMentionDropdown(false);
    } catch (error) {
      console.error('Error attaching library document:', error);
      onAddStatus(`❌ Failed to attach document`);
    }
  };

  const handleInputChange = (e) => {
    let newValue = e.target.value

    // 🔥 Dynamic Auto-fill for pasted/typed text with placeholders
    const activeProject = currentProject;
    if (activeProject && hasAutoFillablePlaceholders(newValue, activeProject)) {
      const result = autoFillPrompt(newValue, activeProject, currentCampaign);
      newValue = result.filledPrompt;
      if (result.replacements && result.replacements.length > 0) {
        onAddStatus(`✨ Auto-filled ${result.replacements.length} placeholder(s) from project`);
      }
    }

    setUserInput(newValue)

    if (selectedPlaceholderIndex !== null) {
      setSelectedPlaceholderIndex(null)
    }

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
      const spaceIdx = textAfterAt.indexOf(' ');
      if (spaceIdx === -1) {
        setMentionSearchText(textAfterAt);
        setShowMentionDropdown(true);
        if (libraryDocuments.length === 0) {
          loadLibraryDocuments();
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }

    // 🔥 RESET HEIGHT WHEN EMPTY
    if (!newValue.trim()) {
      adjustHeight();
      return
    }

    // 🔥 AUTO-EXPAND AS USER TYPES
    adjustHeight();
  }

  const handleKeyDown = (e) => {
    if (showMentionDropdown && mentionFilteredDocs.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev + 1) % mentionFilteredDocs.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev - 1 + mentionFilteredDocs.length) % mentionFilteredDocs.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectDocumentForAttachment(mentionFilteredDocs[activeMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }

    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSubmit(e);
    }
    // Allow Shift+Enter for new line (default behavior)
  };


  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    // Add the suggestion with a period at the end
    const newText = userInput + ' ' + suggestion + '.';
    setUserInput(newText);
    setSuggestions([]);
    setGhostSuggestion(''); // 🔥 Clear ghost

    // Trigger next round of suggestions after a short delay
    setTimeout(() => {
      debouncedAutocomplete(newText);
    }, 100);

    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 🔥 NEW: Accept ghost suggestion (Tab key)
  const acceptGhostSuggestion = () => {
    if (!ghostSuggestion) return;
    const newText = userInput + ' ' + ghostSuggestion + '.';
    setUserInput(newText);
    setGhostSuggestion('');
    setSuggestions([]);

    // Auto-resize textarea
    setTimeout(() => {
      adjustHeight();
    }, 10);

    // Trigger next round after accepting
    setTimeout(() => {
      debouncedAutocomplete(newText);
    }, 200);
  };

  // 🔥 NEW: Cycle to next ghost suggestion
  const cycleGhostSuggestion = (direction = 1) => {
    if (suggestions.length <= 1) return;
    const newIndex = (selectedSuggestionIndex + direction + suggestions.length) % suggestions.length;
    setSelectedSuggestionIndex(newIndex);
    setGhostSuggestion(suggestions[newIndex]);
  };

  const handlePlaceholderClick = (index) => {
    const currentTokens = tokenizePrompt(userInput);
    if (!currentTokens[index] || currentTokens[index].type !== 'placeholder') return;

    let startPos = 0;
    for (let i = 0; i < index; i++) {
      startPos += currentTokens[i].value.length;
    }
    const endPos = startPos + currentTokens[index].value.length;

    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(startPos, endPos);
    }
    setSelectedPlaceholderIndex(index);
  };

  const handleImprove = async () => {
    if (!userInput.trim()) {
      onAddStatus("Please enter a prompt first");
      return;
    }

    setIsEnhancing(true);
    onAddStatus("✨ Enhancing your prompt...");

    try {
      const result = await enhancePrompt(userInput, selectedLLM);
      setUserInput(result.enhanced_prompt);

      setTimeout(() => {
        adjustHeight();
      }, 0);

      onAddStatus(`✓ Prompt enhanced. Preserved ${result.variables_preserved.length} variable(s)`);
    } catch (error) {
      onAddStatus("Error enhancing prompt: " + error.message);
      console.error(error);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Internal poll helper — shared by handleCompare + restore-on-mount
  const _startPoll = (sessionId, variantMsgId) => {
    if (variantPollRef.current) clearInterval(variantPollRef.current);
    variantPollCountRef.current = 0;

    variantPollRef.current = setInterval(async () => {
      variantPollCountRef.current += 1;

      // Hard limit: stop polling after MAX_POLLS ticks
      if (variantPollCountRef.current >= MAX_POLLS) {
        clearInterval(variantPollRef.current);
        variantPollRef.current = null;
        onAddStatus('⏱️ Comparison timed out — try again');
        setIsComparing(false);
        if (setIsProcessing) setIsProcessing(false);
        return;
      }

      try {
        const updated = await pollVariantSession(sessionId);
        // Update the variants card in chat
        window.dispatchEvent(new CustomEvent('update-variant-message', {
          detail: { messageId: variantMsgId, variants: updated.variants, status: updated.status }
        }));

        const allDone = updated.variants.every(
          v => v.status !== 'pending' && v.status !== 'generating'
        );
        const sessionTerminated = updated.status === 'done' || updated.status === 'failed';

        if (allDone || sessionTerminated) {
          clearInterval(variantPollRef.current);
          variantPollRef.current = null;
          const convId = updated.conversation_id || localStorage.getItem('currentConversationId');
          if (convId) localStorage.removeItem(`variantSession_${convId}`);

          const anyCompleted = updated.variants.some(v => v.status === 'completed');
          const allFailed = updated.variants.every(v => v.status === 'failed');

          if (allFailed) {
            onAddStatus('❌ All models failed — check your API keys in .env and try again');
          } else if (anyCompleted) {
            onAddStatus('✓ Models generated — pick your favourite');
          } else {
            onAddStatus('⚠️ Generation finished with errors');
          }
          setIsComparing(false);
          if (setIsProcessing) setIsProcessing(false);
        }
      } catch (pollErr) {
        console.error('Poll error:', pollErr);
      }
    }, 2500);
  };

  // ── Compare LLMs Handler ────────────────────────────────────────────────────
  // Called from ModelPickerModal.onConfirm with the user's chosen model keys
  const handleCompare = async (selectedModels, customText = null, customFiles = null) => {
    const text = (customText !== null ? customText : userInput).trim();
    if (!text && (!customFiles || customFiles.length === 0)) {
      onAddStatus('Please enter a prompt or attach a file first to compare LLMs');
      return;
    }
    if (isComparing) return;

    setIsComparing(true);
    if (setIsProcessing) setIsProcessing(true);
    onAddStatus(`⚡ Starting comparison with ${selectedModels.length} models...`);

    let convId = currentConversationId;
    try {
      // Ensure we have a conversation
      if (!convId && true) {
        const userId = localStorage.getItem('userId');
        const activeTeamId = currentTeam ? currentTeam.id : null;
        const title = text.substring(0, 30) + '...';
        const newConv = await createConversation(title, activeTeamId, userId, currentProject?.id);
        convId = newConv.id;
        onConversationIdChange(convId);
      }

      // Show user message
      const filesToUse = customFiles !== null ? customFiles : attachedFiles;
      onSendMessage('user', text || "(File attachment only)", filesToUse);
      if (customText === null) {
        setUserInput('');
        setAttachedFiles([]);
        adjustHeight();
      }

      // Inject the temporary variants placeholder immediately to show LoadingJoke
      onSendMessage('variants', '', null, 'variants-temp', null, {
        sessionId: 'temp',
        userRequest: text,
        variants: selectedModels.map(m => ({ llm_name: m, status: 'pending', content: null })),
        conversationId: convId,
      });

      // Start variant session — pass user-selected models
      const session = await startVariantSession({
        userMessage: text,
        conversationId: convId,
        projectId: currentProject?.id || null,
        selectedModels,          // new: tell backend which models to use
        incognito: false
      });

      const finalConvId = convId || session.conversation_id;
      if (!convId && session.conversation_id) {
        onConversationIdChange(session.conversation_id);
      }

      // Persist to localStorage so reload can restore it
      localStorage.setItem(`variantSession_${finalConvId}`, JSON.stringify({
        sessionId: session.session_id,
        userRequest: text,
      }));

      // Resolve placeholder with real data
      const variantMsgId = `variants-${session.session_id}`;
      window.dispatchEvent(new CustomEvent('resolve-variant-placeholder', {
        detail: {
          tempId: 'variants-temp',
          realId: variantMsgId,
          sessionId: session.session_id,
          variants: session.variants
        }
      }));

      onAddStatus(`⚡ Generating with ${selectedModels.length} models in parallel...`);
      _startPoll(session.session_id, variantMsgId);

    } catch (err) {
      console.error('Compare LLMs error:', err);
      onAddStatus('❌ Compare failed: ' + err.message);
      setIsComparing(false);
      if (setIsProcessing) setIsProcessing(false);
      // Remove temporary placeholder
      window.dispatchEvent(new CustomEvent('remove-message', {
        detail: { messageId: 'variants-temp' }
      }));
    }
  };

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (variantPollRef.current) clearInterval(variantPollRef.current);
    };
  }, []);

  const submitGeneration = (text, files = [], title = '') => {
    pendingSubmitRef.current = { text: text || '', files: files || [], title: title || '' };
    handleSubmit(null);
  };

  useImperativeHandle(ref, () => ({
    sendMessage,
    handleCompare,
    submitGeneration,
    setText: setUserInput,
    setTemplate: (description, title) => {
      setUserInput(description);
      setPromptTitle(title);
    }
  }));

  const sendMessage = async (
    text,
    files = [],
    customMessages = null,
    skipPlaceholder = false,
    editingMessageId = null,
    externalPromptTitle = null
  ) => {
    // 🔥 Soft lock (plan expired / trial expired / token exhausted) check
    if (isSoftLocked) {
      console.log('🚫 Message blocked: soft locked');
      let statusMsg = "🪙 Token credits used. Please top up to continue generating.";
      if (isPlanExpiredLocked) {
        statusMsg = "⌛ Your plan has expired. Please renew or upgrade to continue.";
      } else if (isTrialLocked) {
        statusMsg = "⌛ Your trial has expired. Please upgrade to continue.";
      }
      onAddStatus(statusMsg);
      if (setIsProcessing) setIsProcessing(false);
      window.dispatchEvent(new CustomEvent('open-trial-lockout'));
      return;
    }

    // 🔥 Dynamic Auto-fill for text with placeholders if inside a project
    const activeProject = currentProject;
    if (activeProject && hasAutoFillablePlaceholders(text, activeProject)) {
      const result = autoFillPrompt(text, activeProject, currentCampaign);
      text = result.filledPrompt;
      console.log('✅ Auto-filled placeholders in sendMessage:', result.replacements);
    }

    // 🔥 Synchronous double-submit guard
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const currentPromptTitle = externalPromptTitle || promptTitle;

    if (setIsProcessing) setIsProcessing(true);
    const currentFiles = files || [];

    onAddStatus("Processing ...");

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    abortControllerRef.current = new AbortController();
    let convId = currentConversationId;

    try {
      if (!convId && true) {
        const title = text.substring(0, 25) + (text.length > 25 ? '...' : '');
        const activeTeamId = currentTeam ? currentTeam.id : null;
        const newConv = await createConversation(title, activeTeamId, userId, currentProject?.id);
        convId = newConv.id;
        onConversationIdChange(convId);
      }

      if (!skipPlaceholder) {
        onSendMessage("assistant", "", null, null, selectedLLM);
      }
      let firstChunkReceived = false;
      const result = await callBackendChatStream(
        text,
        convId,
        currentFiles,
        currentPromptTitle,
        abortControllerRef.current.signal,
        selectedLLM,
        userId,
        userName,
        currentTeam?.id || null,
        customMessages || messages,
        false, // disableBrandVoice
        
        (chunk, fullText) => {
          if (!firstChunkReceived && chunk) {
            firstChunkReceived = true;
            setPdfProgress(null);
          }
          if (onUpdateLastMessage) {
            onUpdateLastMessage(fullText);
          }
          // Detect context overflow surfaced mid-stream
          if (fullText && fullText.startsWith('Error:') && /maximum context length|context_length_exceeded|context window/i.test(fullText)) {
            setContextWindowWarning(true);
          }
        },
        !!editingMessageId,
        editingMessageId,
        (current, total, filename, done) => {
          if (done) {
            setPdfProgress(null);
          } else {
            setPdfProgress({ current, total, filename });
          }
        }
      );

      if (result && result.messageId && onUpdateLastMessageId) {
        onUpdateLastMessageId(result.messageId);
      }

      if (result && result.conversationId && result.conversationId !== currentConversationId) {
        onConversationIdChange(result.conversationId);
      }

      onAddStatus("✓ Response complete");

      // 🔄 Refresh sidebar recent chats after each completed response (non-incognito only)
      if (true) {
        window.dispatchEvent(new CustomEvent('refresh-sidebar-recent'));
      }
    } catch (err) {
      console.error('❌ InputBar sendMessage ERROR:', err);
      if (err.name === 'AbortError') {
        if (onUpdateLastMessage) {
          onUpdateLastMessage(prev => {
            if (prev && prev.trim() && prev !== '...' && prev !== '') {
              return prev + "\n\n⏹ *Stopped by user*";
            }
            return "⏹ *Stopped by user*";
          });
        }
        onAddStatus("⏹ Request cancelled");
      } else if (err.next_action === 'trial_expired') {
        const message = err.message || "⌛ Your trial has expired. Please upgrade to continue.";
        if (!skipPlaceholder && onUpdateLastMessage) {
          onUpdateLastMessage(message);
        } else {
          onSendMessage("assistant", message, null);
        }
        window.dispatchEvent(new CustomEvent('open-trial-lockout'));
      } else if (err.next_action === 'tokens_exhausted') {
        const message = err.message || "🪙 Your token credits are used. Please top up to continue.";
        if (!skipPlaceholder && onUpdateLastMessage) {
          onUpdateLastMessage(message);
        } else {
          onSendMessage("assistant", message, null);
        }
        window.dispatchEvent(new CustomEvent('token-exhausted'));
      } else {
        const displayMsg = (err.message && typeof err.message === 'string' && err.message !== '[object Object]') 
          ? err.message 
          : (typeof err === 'string' ? err : JSON.stringify(err));
        // Detect context length overflow and show persistent banner instead of inline error
        if (/maximum context length|context_length_exceeded|context window/i.test(displayMsg)) {
          setContextWindowWarning(true);
        } else {
          onAddStatus("Error: " + displayMsg);
          if (!skipPlaceholder && onUpdateLastMessage) {
            onUpdateLastMessage("Error: " + displayMsg);
          } else {
            onSendMessage("assistant", "Error: " + displayMsg, null);
          }
        }
      }
    } finally {
      abortControllerRef.current = null;
      setIsStopping(false);
      if (setIsProcessing) setIsProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 🔥 Synchronous double-submit guard (useRef is instant, unlike useState)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (isProcessing) { isSubmittingRef.current = false; return; }
    if (setIsProcessing) setIsProcessing(true);

    // 🪙 TOKEN EXHAUSTION / EXPIRATION CHECK
    if (isSoftLocked) {
      console.log('🚫 Message blocked: soft locked');
      let statusMsg = "🪙 Token credits used. Please top up to continue generating.";
      if (isPlanExpiredLocked) {
        statusMsg = "⌛ Your plan has expired. Please renew or upgrade to continue.";
      } else if (isTrialLocked) {
        statusMsg = "⌛ Your trial has expired. Please upgrade to continue.";
      }
      onAddStatus(statusMsg);
      if (setIsProcessing) setIsProcessing(false);
      isSubmittingRef.current = false;
      window.dispatchEvent(new CustomEvent('open-trial-lockout'));
      return;
    }

    // 🔥 DEBUG: Check state at the start
    console.log('🔥 handleSubmit START');
    console.log('🔥 promptTitle state:', promptTitle);
    console.log('🔥 userInput:', userInput.substring(0, 50));

    // 🔥 Resolve text from composer or external queue (home/pending prompt)
    let text = userInput.trim();
    if (!text && pendingSubmitRef.current?.text) {
      text = pendingSubmitRef.current.text.trim();
    }
    
    const externalFiles = pendingSubmitRef.current?.files || [];
    const externalTitle = pendingSubmitRef.current?.title || '';

    if (!text && attachedFiles.length === 0 && externalFiles.length === 0) {
      if (setIsProcessing) setIsProcessing(false);
      isSubmittingRef.current = false;
      pendingSubmitRef.current = null;
      return;
    }

    // 🔥 NEW: Auto-fill placeholders ONLY if inside a project
    const activeProject = currentProject;
    if (activeProject && hasAutoFillablePlaceholders(text, activeProject)) {
      const result = autoFillPrompt(text, activeProject, currentCampaign);
      text = result.filledPrompt;
      console.log('✅ Auto-filled placeholders:', result.replacements);
      if (result.replacements.length > 0) {
        onAddStatus(`✨ Auto-filled ${result.replacements.length} placeholder(s) from project`);
      }
    } else if (!activeProject) {
      console.log('ℹ️ No project context - skipping auto-fill');
    }

    // 🔥 CAPTURE VALUES FIRST - BEFORE ANY STATE UPDATES
    const currentPromptTitle = promptTitle || externalTitle;
    const currentFiles = attachedFiles.length > 0 ? [...attachedFiles] : [...externalFiles];
    pendingSubmitRef.current = null;
    const activeTeamId = currentTeam ? currentTeam.id : null;
    console.log('📤 CAPTURED promptTitle:', currentPromptTitle);
    console.log('📤 CAPTURED files count:', currentFiles.length);
    
    // If compare mode is enabled and multiple models are selected:
    if (isCompareMode && selectedCompareModels.length > 1) {
      isSubmittingRef.current = false;
      if (setIsProcessing) setIsProcessing(false);
      handleCompare(selectedCompareModels, text, currentFiles);
      return;
    } else if (isCompareMode && selectedCompareModels.length === 1) {
      if (onLLMChange) onLLMChange(selectedCompareModels[0]);
    } else if (isCompareMode && selectedCompareModels.length === 0) {
      onAddStatus('⚠️ Please select at least one model or disable compare mode.');
      isSubmittingRef.current = false;
      if (setIsProcessing) setIsProcessing(false);
      return;
    }

    // Prepare attachments metadata for display
    const attachmentsForDisplay = currentFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      data: f.data
    }));

    if (onSendMessage) {
      onSendMessage("user", text || "(File attachment only)", attachmentsForDisplay);
    }

    setUserInput("");
    setSuggestions([]);
    setGhostSuggestion('');
    setAttachedFiles([]);
    setPromptTitle("");
    adjustHeight();

    isSubmittingRef.current = false;
    if (setIsProcessing) setIsProcessing(false);

    sendMessage(text, currentFiles);
  };



  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  /* 🔥 STOP HANDLER: Abort local fetch and notify parent */
  const handleStopClick = (e) => {
    e.preventDefault();
    console.log('🛑 Stop button clicked - Aborting request...');

    // 1. Abort locally
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('✅ Local fetch aborted');
    }

    // 2. Notify parent to update UI state
    if (onStopProcessing) {
      onStopProcessing();
    }

    setIsStopping(true);
  };

  const menuItemStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13
  };

  const selectedLLMOption = LLM_OPTIONS.find(o => o.id === selectedLLM) || LLM_OPTIONS[0];

  // What to display on the model button:
  let buttonLabel = selectedLLMOption.label;
  if (isCompareMode) {
    if (selectedCompareModels.length === 0) {
      buttonLabel = "Select models";
    } else if (selectedCompareModels.length === 1) {
      const singleModel = LLM_OPTIONS.find(o => o.id === selectedCompareModels[0]);
      buttonLabel = singleModel ? singleModel.label : "1 model";
    } else {
      buttonLabel = `Compare (${selectedCompareModels.length})`;
    }
  }

  // Model Selection Dropdown:
  const renderModelDropdown = () => {
    if (!isModelDropdownOpen) return null;
    return (
      <div
        ref={modelDropdownRef}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          right: 0,
          width: '240px',
          background: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: '12px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Toggle Area */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: activeTheme.text }}>Compare LLM</span>
            <div className="relative group flex items-center">
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: activeTheme.surface2,
                  border: `1px solid ${activeTheme.borderStrong}`,
                  color: activeTheme.text3,
                  fontSize: '10px',
                  fontWeight: '700',
                  fontStyle: 'italic',
                  fontFamily: 'serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0
                }}
              >
                i
              </span>
              <div 
                className="absolute left-0 top-6 hidden group-hover:block z-50 w-52 p-2 shadow-lg pointer-events-none"
                style={{ 
                  background: activeTheme.surface3,
                  color: activeTheme.text,
                  border: `1px solid ${activeTheme.borderStrong}`,
                  borderRadius: '0px',
                  fontSize: '11.5px', 
                  lineHeight: '1.4', 
                  fontWeight: 500 
                }}
              >
                Send your prompt to multiple AI models simultaneously to compare output quality side-by-side.
              </div>
            </div>
          </div>
          <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
            <input 
              type="checkbox" 
              checked={isCompareMode}
              onChange={(e) => {
                const val = e.target.checked;
                setIsCompareMode(val);
                if (val) {
                  if (selectedCompareModels.length === 0 && selectedLLM) {
                    setSelectedCompareModels([selectedLLM]);
                  }
                }
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: isCompareMode ? activeTheme.accent : activeTheme.borderStrong,
              transition: '.2s', borderRadius: '20px'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '14px', width: '14px', left: isCompareMode ? '18px' : '4px', bottom: '3px',
                backgroundColor: 'white', transition: '.2s', borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>
        
        <div style={{ height: '1px', background: activeTheme.border, margin: '8px 0' }} />
        
        <style>{`
          .custom-llm-dropdown-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .custom-llm-dropdown-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-llm-dropdown-scroll::-webkit-scrollbar-thumb {
            background: ${activeTheme.border};
            border-radius: 4px;
          }
          .custom-llm-dropdown-scroll::-webkit-scrollbar-thumb:hover {
            background: ${activeTheme.borderStrong};
          }
        `}</style>
        {/* Model Options List */}
        <div className="custom-llm-dropdown-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {LLM_OPTIONS.map(opt => {
            const hiddenList = hiddenLLMModels ? hiddenLLMModels.split(',') : [];
            const isHidden = hiddenList.includes(opt.id);
            const isChecked = isCompareMode ? selectedCompareModels.includes(opt.id) : selectedLLM === opt.id;
            
            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (isHidden) return;
                  if (isCompareMode) {
                    if (isChecked) {
                      setSelectedCompareModels(prev => prev.filter(id => id !== opt.id));
                    } else {
                      if (selectedCompareModels.length >= 4) {
                        onAddStatus('⚠️ Max 4 models can be selected for comparison.');
                        return;
                      }
                      setSelectedCompareModels(prev => [...prev, opt.id]);
                    }
                  } else {
                    if (onLLMChange) onLLMChange(opt.id);
                    setIsModelDropdownOpen(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: isHidden ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  color: isHidden ? activeTheme.text3 : activeTheme.text,
                  opacity: isHidden ? 0.65 : 1,
                  background: (!isHidden && isChecked) ? activeTheme.surface2 : 'transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { if (!isHidden) e.currentTarget.style.background = activeTheme.surface3; }}
                onMouseLeave={(e) => { if (!isHidden) e.currentTarget.style.background = isChecked ? activeTheme.surface2 : 'transparent'; }}
              >
                <span>{opt.label}</span>
                {isHidden ? (
                  <span style={{
                    fontSize: '11px',
                    color: activeTheme.danger,
                    fontWeight: 500,
                    background: activeTheme.dangerSoft,
                    border: `1px solid ${activeTheme.border}`,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    Under Service
                  </span>
                ) : (
                  isCompareMode ? (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    isChecked && <span style={{ color: activeTheme.accent, fontWeight: 'bold' }}>✓</span>
                  )
                )}
              </div>
            );
          })}
        </div>
        
        {/* Done / Compare Actions */}
        {isCompareMode && (
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsModelDropdownOpen(false)}
              style={{
                padding: '4px 10px',
                background: activeTheme.text,
                color: activeTheme.bg,
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="input-bar" style={{ borderTop: 'none', background: 'transparent', padding: '0 24px 10px' }}>
      <style>{`
        .input-bar textarea::placeholder {
          color: ${activeTheme.bg === "#151311" ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.4)"} !important;
        }
      `}</style>
      <div style={{ maxWidth: 850, margin: '0 auto', width: '100%', position: 'relative' }}>

        {/* Context Window Warning Banner */}
        {contextWindowWarning && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                flexShrink: 0
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span style={{ color: '#15803d', lineHeight: 1.4 }}>
                This conversation is getting too long for the AI to process. Please start a new chat to continue.
              </span>
            </div>
            <button
              onClick={() => setContextWindowWarning(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#15803d',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              title="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {uploadError && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fda4af',
            color: '#be123c',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '12px',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.05)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: '#ffe4e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
                flexShrink: 0
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <span style={{ color: '#9f1239', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9f1239',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              title="Dismiss error"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* PDF Progress Bar */}
        {pdfProgress && pdfProgress.total > 0 && (
          <div style={{
            marginBottom: 10,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Processing {pdfProgress.filename ? `"${pdfProgress.filename}" ` : ''}- Page {pdfProgress.current} / {pdfProgress.total}
            </span>
            <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(pdfProgress.current / pdfProgress.total) * 100}%`,
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                borderRadius: 3,
                transition: 'width 0.4s ease',
                animation: 'pdfGlow 1.4s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}


        {/* Empty State removed per UI overhaul */}



        {/* ── Template Buttons (Moved below form) ────────────── */}

        {/* ── Active Context: Placeholders & Files (Standalone) ───────────────── */}
        {isLoadingSuggestions && (
          <div className="active-context-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            {/* Ghost text loading indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 0', fontSize: 11, color: '#6b7280'
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1.5px solid #d1d5db', borderTopColor: '#6b7280',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Thinking of suggestions...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}
          style={{
            background: activeTheme.bg === "#151311" ? activeTheme.surface : '#ffffff',
            border: `1px solid ${activeTheme.border}`,
            borderRadius: '0px',
            padding: '20px 20px 16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            color: activeTheme.text,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            position: 'relative'
          }}>

            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                padding: '8px 6px 12px 6px',
                borderBottom: '1px solid #f3f4f6',
                marginBottom: '8px'
              }}>
                {attachedFiles.map((file, index) => {
                  const isImage = file.type && file.type.startsWith('image/');
                  
                  if (isImage) {
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'relative',
                          width: '64px',
                          height: '64px',
                          borderRadius: '10px',
                          border: '1px solid #e5e7eb',
                          overflow: 'visible',
                          background: '#f3f4f6',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => onOpenFilePreview(file)}
                      >
                        <img
                          src={`data:${file.type};base64,${file.data}`}
                          alt={file.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '9px'
                          }}
                        />
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#4b5563';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  }

                  // Non-image files (PDFs, docs, etc.)
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '180px',
                        height: '64px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s'
                      }}
                      onClick={() => onOpenFilePreview(file)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f9ff';
                        e.currentTarget.style.borderColor = '#0284c7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ fontSize: 24, display: 'flex', alignItems: 'center', color: '#4b5563' }}>
                        {getFileIcon(file.type, file.name)}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                        <span style={{
                          fontWeight: 500,
                          color: '#111827',
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: 10 }}>{formatFileSize(file.size)}</span>
                      </div>
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '1px solid #e5e7eb',
                          background: '#ffffff',
                          color: '#4b5563',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          zIndex: 10,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.color = '#4b5563';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          {/* @ Mention Dropdown */}
          {showMentionDropdown && mentionFilteredDocs.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '0',
              right: '0',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 -10px 25px rgba(0,0,0,0.08), 0 10px 25px rgba(0,0,0,0.08)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              {mentionFilteredDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  onClick={() => selectDocumentForAttachment(doc)}
                  onMouseEnter={() => setActiveMentionIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    background: idx === activeMentionIndex ? '#f3f4f6' : 'transparent',
                    color: '#111827',
                    fontWeight: idx === activeMentionIndex ? 600 : 400,
                    transition: 'background 0.1s'
                  }}
                >
                  <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                    {getFileIcon(doc.format || doc.type, doc.name)}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                    {doc.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {(doc.format || doc.type || 'txt').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Highlight Backdrop */}
            <div
              ref={highlightBackdropRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                fontSize: '14px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: '400',
                lineHeight: '1.5',
                padding: '8px 0',
                paddingLeft: '0px',
                paddingRight: '0px',
                margin: 0,
                boxSizing: 'border-box',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'hidden',
                zIndex: 0,
                color: 'transparent',
                border: 'none',
                outline: 'none'
              }}
            >
              {tokens.map((seg) => {
                if (seg.type === 'text') {
                  return <span key={seg.key}>{seg.value}</span>;
                }
                return (
                  <span
                    key={seg.key}
                    style={{
                      background: '#fef3c7',
                      boxShadow: '0 0 0 1px #fbbf24',
                      borderRadius: '4px',
                      padding: '0px 0px 1.5px',
                      margin: '0px',
                      color: 'transparent',
                    }}
                  >
                    {seg.value}
                  </span>
                );
              })}
            </div>



            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleInputChange}
              onClick={(e) => {
                setShowEmptyState(false);
                handleTextareaClick(e);
              }}
              onScroll={handleScroll}
              onPaste={handlePaste}
              placeholder={isSoftLocked ? "Token credits exhausted. Please top up to continue." : "How can I help you today?"}
              disabled={isSoftLocked}
              rows="1"
              style={{
                position: 'relative',
                zIndex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                width: '100%',
                minHeight: '60px',
                maxHeight: '200px',
                lineHeight: '1.5',
                resize: 'none',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: '400',
                padding: '8px 0',
                paddingLeft: '0px',
                paddingRight: '0px',
                margin: 0,
                boxSizing: 'border-box',
                overflow: 'auto',
                color: activeTheme.text,
                caretColor: activeTheme.text,
                cursor: isSoftLocked ? 'not-allowed' : 'text'
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: 'none',
            paddingTop: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="file"
                id="fileInput"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('fileInput').click()}
                disabled={isSoftLocked}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '26px',
                  color: activeTheme.bg === "#151311" ? "#ffffff" : "#6b7280",
                  cursor: isSoftLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (!isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "rgba(255,255,255,0.06)" : "#F5F5F5"; }}
                onMouseLeave={(e) => { if (!isSoftLocked) e.currentTarget.style.background = 'transparent'; }}
              >
                +
              </button>

              {/* Prompts Library Book Icon Button */}
              <button
                type="button"
                onClick={() => {
                  const isEmpty = !messages || !messages.some(m => m.role !== 'status');
                  if (isEmpty && onNavigateToPrompts) {
                    onNavigateToPrompts();
                  } else if (onOpenPromptsModal) {
                    onOpenPromptsModal();
                  }
                }}
                disabled={isSoftLocked}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: activeTheme.bg === "#151311" ? "#ffffff" : "#4b5563",
                  cursor: isSoftLocked ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { if (!isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "rgba(255,255,255,0.06)" : "#F5F5F5"; }}
                onMouseLeave={(e) => { if (!isSoftLocked) e.currentTarget.style.background = 'transparent'; }}
                title="Prompt Library"
              >
                <svg width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" style={{ color: activeTheme.bg === "#151311" ? "#ffffff" : "#4b5563" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Improve Pill */}
              {!userInput.trim() ? (
                <Tooltip text="Write some prompt first">
                  <div style={{ display: 'inline-block' }}>
                    <button
                      type="button"
                      disabled={true}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        background: '#f9fafb',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#9ca3af',
                        cursor: 'not-allowed',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        opacity: 0.6,
                        pointerEvents: 'none'
                      }}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '12px' }}></i>
                      <span>Improve</span>
                    </button>
                  </div>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={isEnhancing || isSoftLocked}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    background: activeTheme.bg === "#151311" ? activeTheme.surface3 : "#f3f4f6",
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: activeTheme.bg === "#151311" ? "#ffffff" : "#374151",
                    cursor: (isEnhancing || isSoftLocked) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    opacity: isSoftLocked ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isEnhancing && !isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "rgba(255,255,255,0.08)" : '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    if (!isEnhancing && !isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? activeTheme.surface3 : '#f3f4f6';
                  }}
                >
                  {isEnhancing ? (
                    <div style={{ width: '12px', height: '12px', border: `2px solid ${activeTheme.bg === "#151311" ? "#ffffff" : "#374151"}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '12px' }}></i>
                  )}
                  <span>Improve</span>
                </button>
              )}


              {/* Custom LLM Selector Trigger */}
              <div style={{ position: 'relative', marginRight: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  disabled={isSoftLocked}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: activeTheme.bg === "#151311" ? "#ffffff" : "#374151",
                    cursor: isSoftLocked ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                  onMouseEnter={(e) => { if (!isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "rgba(255,255,255,0.06)" : '#e5e7eb'; }}
                  onMouseLeave={(e) => { if (!isSoftLocked) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{buttonLabel}</span>
                  <span style={{ fontSize: '8px', color: activeTheme.bg === "#151311" ? "#ffffff" : '#6b7280' }}>▼</span>
                </button>
                {renderModelDropdown()}
              </div>

              {/* 🎤 Voice Input */}
              <VoiceInput
                onTranscript={(text) => {
                  setUserInput(prev => prev ? prev + ' ' + text : text);
                }}
                textareaRef={textareaRef}
                disabled={isSoftLocked}
              />

              {/* Send Button */}
              <button
                type={isProcessing ? "button" : "submit"}
                onClick={isProcessing ? (isStopping ? undefined : handleStopClick) : undefined}
                disabled={isStopping || isSoftLocked || (!isProcessing && !userInput.trim() && attachedFiles.length === 0)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isSoftLocked ? '#9ca3af' : (activeTheme.bg === "#151311" ? "#ffffff" : "#111827"),
                  color: activeTheme.bg === "#151311" ? "#000000" : "#ffffff",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSoftLocked ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  padding: 0
                }}
                onMouseEnter={(e) => { if (!isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "#e5e7eb" : "#374151"; }}
                onMouseLeave={(e) => { if (!isSoftLocked) e.currentTarget.style.background = activeTheme.bg === "#151311" ? "#ffffff" : "#111827"; }}
              >
                {isStopping ? (
                  <div style={{ width: '12px', height: '12px', border: `2px solid ${activeTheme.bg === "#151311" ? "#000" : "#fff"}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : isProcessing ? (
                  <div style={{ width: '10px', height: '10px', background: activeTheme.bg === "#151311" ? 'black' : 'white', borderRadius: '2px' }} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeTheme.bg === "#151311" ? "#000000" : "#ffffff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>



      </div >

    </div >
  );
});

export default InputBar;
