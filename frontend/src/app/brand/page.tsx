"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  MessageSquare,
  Target,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  BrandProfile,
  BrandProfileUpdateRequest,
  ExtractBrandRequest,
  fetchBrandProfile,
  extractBrandFromWebsite,
  updateBrandProfile,
} from "@/lib/api-client";
import { FadeIn } from "@/lib/motion";

import { BrandExtractionWizard } from "@/components/brand/BrandExtractionWizard";
import { BrandSnapshotCard } from "@/components/brand/BrandSnapshotCard";
import { BrandIdentityVoiceTab } from "@/components/brand/BrandIdentityVoiceTab";
import { BrandOfferingsTab } from "@/components/brand/BrandOfferingsTab";
import { BrandGuardrailsTab } from "@/components/brand/BrandGuardrailsTab";

export default function BrandIdentityPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState("voice");

  // Scraper extraction state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeBrandName, setScrapeBrandName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [extractionStep, setExtractionStep] = useState<string>("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State: Core
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [tagline, setTagline] = useState("");

  // Visual Identity State
  const [palettePrimary, setPalettePrimary] = useState("#0F172A");
  const [paletteAccent, setPaletteAccent] = useState("#38BDF8");
  const [paletteNeutral, setPaletteNeutral] = useState("#F8FAFC");
  const [aestheticSummary, setAestheticSummary] = useState("");
  const [imageryStyle, setImageryStyle] = useState("");
  const [negativePrompts, setNegativePrompts] = useState("");

  // Written Identity State
  const [archetype, setArchetype] = useState("Technical Expert");
  const [toneAttributes, setToneAttributes] = useState<string[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [formattingRules, setFormattingRules] = useState("");

  // Core Value Props State
  const [valueProps, setValueProps] = useState<string[]>([]);

  // ICP Pain Points State
  const [icpPainPoints, setIcpPainPoints] = useState<
    { feature: string; pain_hook: string; target_persona: string }[]
  >([]);

  // Conversion Assets State
  const [leadMagnets, setLeadMagnets] = useState<string[]>([]);
  const [ctaTemplates, setCtaTemplates] = useState<string[]>([]);
  const [offerHooks, setOfferHooks] = useState<string[]>([]);

  // Compliance Policies State
  const [competitorBlacklist, setCompetitorBlacklist] = useState<string[]>([]);
  const [sensitiveTopics, setSensitiveTopics] = useState<string[]>([]);
  const [mandatoryDisclaimers, setMandatoryDisclaimers] = useState<string[]>([]);

  // Populate local form from BrandProfile
  const syncFormFromProfile = (data: BrandProfile) => {
    setBrandName(data.brand_name || "");
    setWebsiteUrl(data.website_url || "");
    setTagline(data.tagline || "");

    const vis = data.visual_identity || {};
    const pal = vis.palette || {};
    setPalettePrimary(pal.primary || "#0F172A");
    setPaletteAccent(pal.accent || "#38BDF8");
    setPaletteNeutral(pal.neutral || "#F8FAFC");
    setAestheticSummary(vis.aesthetic_summary || "");
    setImageryStyle(vis.imagery_style || "");
    setNegativePrompts(vis.negative_prompts || "");

    const writ = data.written_identity || {};
    setArchetype(writ.archetype || "Technical Expert");
    setToneAttributes(Array.isArray(writ.tone_attributes) ? writ.tone_attributes : []);
    setBannedWords(Array.isArray(writ.banned_words) ? writ.banned_words : []);
    setFormattingRules(writ.formatting_rules || "");

    const pol = writ.compliance_policies || {};
    setCompetitorBlacklist(Array.isArray(pol.competitor_blacklist) ? pol.competitor_blacklist : []);
    setSensitiveTopics(Array.isArray(pol.sensitive_topics) ? pol.sensitive_topics : []);
    setMandatoryDisclaimers(Array.isArray(pol.mandatory_disclaimers) ? pol.mandatory_disclaimers : []);

    setValueProps(Array.isArray(data.core_value_props) ? data.core_value_props : []);

    const conv = data.conversion_assets || {};
    setLeadMagnets(Array.isArray(conv.lead_magnets) ? conv.lead_magnets : []);
    setCtaTemplates(Array.isArray(conv.cta_templates) ? conv.cta_templates : []);
    setOfferHooks(Array.isArray(conv.offer_hooks) ? conv.offer_hooks : []);

    setIcpPainPoints(
      Array.isArray(data.icp_pain_points)
        ? data.icp_pain_points.map((p) => ({
            feature: p.feature || "",
            pain_hook: p.pain_hook || "",
            target_persona: p.target_persona || "General",
          }))
        : []
    );
    setHasUnsavedChanges(false);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBrandProfile();
      if (data) {
        setProfile(data);
        syncFormFromProfile(data);
      }
    } catch {
      setErrorMessage("Unable to fetch brand profile. Please verify API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadData]);

  // Mark unsaved when any value changes
  const markDirty = () => setHasUnsavedChanges(true);

  // Trigger one-click extraction
  const handleStartExtraction = async () => {
    const targetUrl = scrapeUrl || websiteUrl;
    if (!targetUrl.trim()) {
      setErrorMessage("Please enter a valid website URL to extract brand data.");
      return;
    }

    setExtracting(true);
    setErrorMessage(null);
    setExtractionStep("Connecting to website and scraping semantic assets...");

    try {
      const req: ExtractBrandRequest = {
        website_url: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
        brand_name: (scrapeBrandName || brandName).trim() || "Brand",
      };

      const res = await extractBrandFromWebsite(req);
      setExtractionJobId(res.job_id);

      let stepIndex = 0;
      const steps = [
        "Analyzing color palette and extracting visual tokens...",
        "Synthesizing brand archetype and tone traits...",
        "Identifying core value propositions and audience pain points...",
        "Finalizing brand profile guardrails...",
      ];

      pollTimerRef.current = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setExtractionStep(steps[stepIndex]);
        } else {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          loadData().then(() => {
            setExtracting(false);
            setExtractionStep("");
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3500);
          });
        }
      }, 1500);
    } catch (err) {
      setExtracting(false);
      setErrorMessage(
        `Failed to start brand extraction: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  // Save manual modifications
  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorMessage(null);

    const payload: BrandProfileUpdateRequest = {
      brand_name: brandName,
      website_url: websiteUrl,
      tagline,
      visual_identity: {
        palette: {
          primary: palettePrimary,
          accent: paletteAccent,
          neutral: paletteNeutral,
        },
        aesthetic_summary: aestheticSummary,
        imagery_style: imageryStyle,
        negative_prompts: negativePrompts,
      },
      written_identity: {
        archetype,
        tone_attributes: toneAttributes,
        banned_words: bannedWords,
        formatting_rules: formattingRules,
        compliance_policies: {
          competitor_blacklist: competitorBlacklist,
          sensitive_topics: sensitiveTopics,
          mandatory_disclaimers: mandatoryDisclaimers,
        },
      },
      core_value_props: valueProps,
      conversion_assets: {
        lead_magnets: leadMagnets,
        cta_templates: ctaTemplates,
        offer_hooks: offerHooks,
      },
      icp_pain_points: icpPainPoints,
    };

    try {
      const updated = await updateBrandProfile(payload);
      setProfile(updated);
      syncFormFromProfile(updated);
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setErrorMessage(
        `Failed to save brand profile: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setSaving(false);
    }
  };

  const totalGuardrailsCount =
    bannedWords.length + competitorBlacklist.length + sensitiveTopics.length + mandatoryDisclaimers.length;

  const hasConfiguredProfile = Boolean(profile && (profile.brand_name || profile.website_url));

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-28">
      {/* 1. Compact Page Header without noisy Active pill */}
      <PageHeader
        title="Brand Identity"
        description="Define voice traits, value propositions, and guardrails to ground all generated content."
        action={
          <Button
            onClick={handleSaveProfile}
            disabled={saving || loading}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 font-medium gap-1.5 shadow-subtle rounded-md px-3.5 transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save changes
              </>
            )}
          </Button>
        }
      />

      {/* Global Alerts */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setErrorMessage(null)}
            className="h-7 text-xs text-rose-300 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Brand guidelines saved. Future generated posts and replies will strictly follow these rules.</span>
        </div>
      )}

      {/* 2. Brand Profile Shown First When Configured */}
      {!loading && hasConfiguredProfile && (
        <BrandSnapshotCard
          brandName={brandName}
          websiteUrl={websiteUrl}
          tagline={tagline}
          archetype={archetype}
          palettePrimary={palettePrimary}
          paletteAccent={paletteAccent}
          paletteNeutral={paletteNeutral}
          toneAttributes={toneAttributes}
          valuePropsCount={valueProps.length}
          painPointsCount={icpPainPoints.length}
          guardrailsCount={totalGuardrailsCount}
          onSelectTab={setActiveTab}
        />
      )}

      {/* 3. Re-Extraction Tool (Shown Prominently Only on First-Run; Secondary Collapsed Bar Otherwise) */}
      <BrandExtractionWizard
        brandName={scrapeBrandName || brandName}
        setBrandName={(val) => {
          setScrapeBrandName(val);
          if (!brandName) setBrandName(val);
          markDirty();
        }}
        websiteUrl={scrapeUrl || websiteUrl}
        setWebsiteUrl={(val) => {
          setScrapeUrl(val);
          if (!websiteUrl) setWebsiteUrl(val);
          markDirty();
        }}
        extracting={extracting}
        extractionStep={extractionStep}
        extractionJobId={extractionJobId}
        onStartExtraction={handleStartExtraction}
        hasProfile={hasConfiguredProfile}
        extractionStatus={profile?.extraction_status}
        lastExtractedAt={profile?.last_extracted_at}
      />

      {/* 4. Progressive 3-Tab Workspace */}
      {loading ? (
        <div className="space-y-4 pt-2">
          <div className="h-10 w-full bg-surface animate-pulse rounded-lg border border-border" />
          <div className="h-80 w-full bg-surface animate-pulse rounded-lg border border-border" />
        </div>
      ) : (
        <FadeIn>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-surface border border-border p-1 h-auto flex flex-wrap gap-1 rounded-lg">
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-md gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-foreground" />
                Identity & Voice
              </TabsTrigger>
              <TabsTrigger
                value="icp"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-md gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Target className="h-3.5 w-3.5 text-foreground" />
                Value Props & ICP Hooks
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-md gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
                Guardrails & Rules
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTITY & VOICE */}
            <TabsContent value="voice" className="space-y-6">
              <BrandIdentityVoiceTab
                brandName={brandName}
                setBrandName={(v) => { setBrandName(v); markDirty(); }}
                websiteUrl={websiteUrl}
                setWebsiteUrl={(v) => { setWebsiteUrl(v); markDirty(); }}
                tagline={tagline}
                setTagline={(v) => { setTagline(v); markDirty(); }}
                aestheticSummary={aestheticSummary}
                setAestheticSummary={(v) => { setAestheticSummary(v); markDirty(); }}
                palettePrimary={palettePrimary}
                setPalettePrimary={(v) => { setPalettePrimary(v); markDirty(); }}
                paletteAccent={paletteAccent}
                setPaletteAccent={(v) => { setPaletteAccent(v); markDirty(); }}
                paletteNeutral={paletteNeutral}
                setPaletteNeutral={(v) => { setPaletteNeutral(v); markDirty(); }}
                imageryStyle={imageryStyle}
                setImageryStyle={(v) => { setImageryStyle(v); markDirty(); }}
                negativePrompts={negativePrompts}
                setNegativePrompts={(v) => { setNegativePrompts(v); markDirty(); }}
                archetype={archetype}
                setArchetype={(v) => { setArchetype(v); markDirty(); }}
                toneAttributes={toneAttributes}
                setToneAttributes={(v) => { setToneAttributes(v); markDirty(); }}
                formattingRules={formattingRules}
                setFormattingRules={(v) => { setFormattingRules(v); markDirty(); }}
              />
            </TabsContent>

            {/* TAB 2: VALUE PROPS & ICP */}
            <TabsContent value="icp" className="space-y-6">
              <BrandOfferingsTab
                valueProps={valueProps}
                setValueProps={(v) => { setValueProps(v); markDirty(); }}
                icpPainPoints={icpPainPoints}
                setIcpPainPoints={(v) => { setIcpPainPoints(v); markDirty(); }}
                leadMagnets={leadMagnets}
                setLeadMagnets={(v) => { setLeadMagnets(v); markDirty(); }}
                ctaTemplates={ctaTemplates}
                setCtaTemplates={(v) => { setCtaTemplates(v); markDirty(); }}
                offerHooks={offerHooks}
                setOfferHooks={(v) => { setOfferHooks(v); markDirty(); }}
              />
            </TabsContent>

            {/* TAB 3: GUARDRAILS & COMPLIANCE */}
            <TabsContent value="compliance" className="space-y-6">
              <BrandGuardrailsTab
                bannedWords={bannedWords}
                setBannedWords={(v) => { setBannedWords(v); markDirty(); }}
                competitorBlacklist={competitorBlacklist}
                setCompetitorBlacklist={(v) => { setCompetitorBlacklist(v); markDirty(); }}
                sensitiveTopics={sensitiveTopics}
                setSensitiveTopics={(v) => { setSensitiveTopics(v); markDirty(); }}
                mandatoryDisclaimers={mandatoryDisclaimers}
                setMandatoryDisclaimers={(v) => { setMandatoryDisclaimers(v); markDirty(); }}
              />
            </TabsContent>
          </Tabs>
        </FadeIn>
      )}

      {/* Sticky Save Bar when edits occur */}
      <div className="fixed bottom-0 left-0 md:left-16 lg:left-64 right-0 z-30 border-t border-border bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2 text-xs">
          {hasUnsavedChanges ? (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              You have unsaved brand changes
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              All brand rules in sync
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (profile) syncFormFromProfile(profile);
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}

          <Button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving || !hasUnsavedChanges}
            size="sm"
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-subtle disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save guidelines</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
