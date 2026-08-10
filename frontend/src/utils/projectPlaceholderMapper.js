/**
 * Smart Placeholder Mapper for Project Data
 * Maps project context to prompt placeholders intelligently
 */

const PLACEHOLDER_MAPPING = {
  'brand name': 'brand_name',
  'brand': 'brand_name',
  'company name': 'brand_name',
  'company': 'brand_name',
  'business name': 'brand_name',
  'your brand': 'brand_name',
  'your company': 'brand_name',
  'brand/professional name': 'brand_name',
  'brand / professional name': 'brand_name',
  'brand/company name': 'brand_name',
  'brand / company name': 'brand_name',
  'brand/company': 'brand_name',
  'brand/business name': 'brand_name',
  'company / brand name': 'brand_name',
  'organization name': 'brand_name',
  'client/brand name': 'brand_name',
  'brand/client name': 'brand_name',
  'professional name': 'brand_name',

  'product': 'product_service',
  'product name': 'product_service',
  'product_name': 'product_service',
  'product/service': 'product_service',
  'product / service': 'product_service',
  'product/service name': 'product_service',
  'your product': 'product_service',
  'topic/product': 'product_service',
  'topic/ product': 'product_service',
  'topic': 'product_service',
  'product/topic': 'product_service',
  'product/ topic': 'product_service',
  'topic/product/event': 'product_service',
  'webinar topic': 'product_service',
  'video topic': 'product_service',
  'recent video topic': 'product_service',
  'offer': 'product_service',

  'campaign': 'campaign_name',
  'campaign name': 'campaign_name',

  'target audience': 'target_audience',
  'audience': 'target_audience',
  'target customer': 'target_audience',
  'ideal customer': 'target_audience',
  'customer persona': 'target_audience',
  'audience - job titles/industry': 'target_audience',
  'audience - job titles / industry': 'target_audience',
  'audience-job titles/industry': 'target_audience',
  'audience - job titles': 'target_audience',

  'brand voice': 'brand_voice',
  'tone': 'brand_voice',
  'voice': 'brand_voice',
  'writing style': 'brand_voice',

  'additional context': 'additional_context',
  'context': 'additional_context',
  'background': 'additional_context',
};

export function extractPlaceholders(promptText) {
  const regex = /\[([^\]]+)\]/g;
  const placeholders = [];
  let match;

  while ((match = regex.exec(promptText)) !== null) {
    placeholders.push({
      full: match[0],
      key: match[1].toLowerCase().trim(),
      start: match.index,
      end: match.index + match[0].length
    });
  }

  return placeholders;
}

export function mapPlaceholderToField(placeholderKey) {
  if (!placeholderKey) return null;
  const normalized = placeholderKey.toLowerCase().trim();

  if (PLACEHOLDER_MAPPING[normalized]) {
    return PLACEHOLDER_MAPPING[normalized];
  }

  if (normalized.includes('brand') || normalized.includes('company') || normalized.includes('business') || normalized.includes('organization') || normalized.includes('professional')) {
    return 'brand_name';
  }
  if (normalized.includes('product') || normalized.includes('service') || normalized.includes('offer')) {
    return 'product_service';
  }
  if (normalized.includes('audience') || normalized.includes('customer') || normalized.includes('persona') || normalized.includes('job title')) {
    return 'target_audience';
  }
  if (normalized.includes('voice') || normalized.includes('tone') || normalized.includes('writing style')) {
    return 'brand_voice';
  }
  if (normalized.includes('campaign')) {
    return 'campaign_name';
  }
  if (normalized.includes('context') || normalized.includes('background')) {
    return 'additional_context';
  }

  return null;
}

export function autoFillPrompt(promptText, projectData, campaignData = null) {
  if (!promptText) {
    return {
      filledPrompt: promptText || '',
      replacements: [],
      unmappedPlaceholders: []
    };
  }

  const brandName = projectData?.brand_name || projectData?.name || projectData?.title || projectData?.brandName || '';
  const productService = projectData?.product_service || projectData?.product || projectData?.products_services || '';
  const targetAudience = projectData?.target_audience || projectData?.audience || projectData?.ideal_customer || '';
  const brandVoice = projectData?.brand_voice || projectData?.tone || projectData?.tone_and_feel || '';
  const companyWebsite = projectData?.company_website || projectData?.website || '';
  const industry = projectData?.industry || '';
  const campaignName = campaignData?.campaign_name || campaignData?.name || projectData?.campaign_name || '';

  const dataContext = {
    brand_name: brandName,
    name: brandName,
    product_service: productService,
    product: productService,
    target_audience: targetAudience,
    audience: targetAudience,
    brand_voice: brandVoice,
    tone: brandVoice,
    company_website: companyWebsite,
    industry: industry,
    campaign_name: campaignName,
    ...(projectData || {}),
    ...(campaignData || {})
  };

  if (brandName) dataContext.brand_name = brandName;
  if (productService) dataContext.product_service = productService;
  if (targetAudience) dataContext.target_audience = targetAudience;
  if (brandVoice) dataContext.brand_voice = brandVoice;

  const placeholders = extractPlaceholders(promptText);
  const replacements = [];
  const unmappedPlaceholders = [];
  let filledPrompt = promptText;

  for (let i = placeholders.length - 1; i >= 0; i--) {
    const placeholder = placeholders[i];
    const fieldName = mapPlaceholderToField(placeholder.key);

    if (fieldName && dataContext[fieldName]) {
      const value = dataContext[fieldName];

      filledPrompt =
        filledPrompt.substring(0, placeholder.start) +
        value +
        filledPrompt.substring(placeholder.end);

      replacements.push({
        placeholder: placeholder.full,
        field: fieldName,
        value: value
      });
    } else {
      unmappedPlaceholders.push({
        placeholder: placeholder.full,
        key: placeholder.key,
        reason: !fieldName ? 'no_mapping' : 'no_value'
      });
    }
  }

  return {
    filledPrompt,
    replacements,
    unmappedPlaceholders
  };
}

export function getReplacementPreview(promptText, projectData, campaignData = null) {
  const placeholders = extractPlaceholders(promptText);
  const preview = [];
  const dataContext = { ...(projectData || {}), ...(campaignData || {}) };
  
  for (const placeholder of placeholders) {
    const fieldName = mapPlaceholderToField(placeholder.key);
    
    if (fieldName && dataContext[fieldName]) {
      preview.push({
        placeholder: placeholder.full,
        willReplace: true,
        newValue: dataContext[fieldName],
        field: fieldName
      });
    } else {
      preview.push({
        placeholder: placeholder.full,
        willReplace: false,
        reason: !fieldName ? 'Unknown placeholder' : 'No value in project',
        field: fieldName || 'unknown'
      });
    }
  }
  
  return preview;
}

export function hasAutoFillablePlaceholders(promptText, projectData, campaignData = null) {
  const placeholders = extractPlaceholders(promptText);
  const dataContext = { ...(projectData || {}), ...(campaignData || {}) };
  
  return placeholders.some(ph => {
    const fieldName = mapPlaceholderToField(ph.key);
    return fieldName && dataContext[fieldName];
  });
}

export function getSuggestionsForPlaceholder(placeholderKey, projectData, campaignData = null) {
  const suggestions = [];
  const key = placeholderKey.toLowerCase();
  const dataContext = { ...(projectData || {}), ...(campaignData || {}) };
  
  for (const [field, value] of Object.entries(dataContext)) {
    if (!value) continue;
    if (field === 'id' || field === 'created_at' || field === 'updated_at') continue;
    
    if (key.includes(field.replace('_', ' ')) || field.replace('_', ' ').includes(key)) {
      suggestions.push({
        field,
        value,
        confidence: 'medium'
      });
    }
  }
  
  return suggestions;
}

export function batchAutoFill(prompts, projectData, campaignData = null) {
  return prompts.map(prompt => ({
    original: prompt,
    ...autoFillPrompt(prompt, projectData, campaignData)
  }));
}

export default {
  extractPlaceholders,
  mapPlaceholderToField,
  autoFillPrompt,
  getReplacementPreview,
  hasAutoFillablePlaceholders,
  getSuggestionsForPlaceholder,
  batchAutoFill
};
