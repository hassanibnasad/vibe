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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchBrandProfile();
      if (data) {
        setProfile(data);
        syncFormFromProfile(data);
        if (data.website_url && !scrapeUrl) {
          setScrapeUrl(data.website_url);
        }
        if (data.brand_name && !scrapeBrandName) {
          setScrapeBrandName(data.brand_name);
        }
      }
    } catch {
      setErrorMessage("Could not load brand profile. Check connection to backend service.");
    } finally {
      setLoading(false);
    }
  }, [scrapeUrl, scrapeBrandName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll for extraction completion
  const startExtractionPolling = () => {
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes (40 * 3s)
    setExtractionStep("Scraping website contents and analyzing visual DOM...");

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts === 4) {
        setExtractionStep("Extracting visual color tokens and brand imagery...");
      } else if (attempts === 8) {
        setExtractionStep("Synthesizing voice archetype, core value propositions, and ICP hooks...");
      } else if (attempts === 15) {
        setExtractionStep("Formulating negative buzzwords and compliance guardrails...");
      }

      try {
        const fresh = await fetchBrandProfile();
        if (fresh && fresh.extraction_status === "complete") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setProfile(fresh);
          syncFormFromProfile(fresh);
          setExtracting(false);
          setExtractionStep("");
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          return;
        } else if (fresh && fresh.extraction_status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setExtracting(false);
          setExtractionStep("Extraction failed on backend scraper. Please verify the URL.");
          return;
        }
      } catch {
        // Continue polling until timeout
      }

      if (attempts >= maxAttempts) {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        setExtracting(false);
        setExtractionStep("Extraction timed out. Refreshing profile status.");
        loadData();
      }
    }, 3000);
  };

  const handleStartExtraction = async () => {
    const targetUrl = scrapeUrl || websiteUrl;
    const targetName = scrapeBrandName || brandName;
    if (!targetUrl.trim() || !targetName.trim()) return;

    setExtracting(true);
    setExtractionStep("Dispatching extraction task to crawler...");
    setErrorMessage(null);

    try {
      const payload: ExtractBrandRequest = {
        website_url: targetUrl.trim(),
        brand_name: targetName.trim(),
      };
      const res = await extractBrandFromWebsite(payload);
      setExtractionJobId(res.job_id);
      startExtractionPolling();
    } catch (err) {
      setExtracting(false);
      setErrorMessage(
        `Failed to start brand extraction: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    const payload: BrandProfileUpdateRequest = {
      brand_name: brandName,
      website_url: websiteUrl,
      tagline: tagline,
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      {/* 1. Header Bar with Clear Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
              Brand Identity & Voice
            </h1>
            {profile && (
              <Badge
                variant="outline"
                className={`text-xs capitalize font-medium ${
                  profile.extraction_status === "complete"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : profile.extraction_status === "failed"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}
              >
                {profile.extraction_status === "complete" ? "Extraction Active" : profile.extraction_status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Define your company voice, core value props, and compliance guardrails for autonomous content generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleSaveProfile}
            disabled={saving || loading}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 text-xs h-9 font-medium gap-1.5 shadow-subtle rounded-lg px-4 transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Saved Changes
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Global Feedback Alerts */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center justify-between">
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
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Brand guidelines saved. Future generated posts and replies will strictly follow these rules.</span>
        </div>
      )}

      {/* 3. Streamlined One-Click Extraction Wizard Hero */}
      <BrandExtractionWizard
        brandName={scrapeBrandName || brandName}
        setBrandName={(val) => {
          setScrapeBrandName(val);
          if (!brandName) setBrandName(val);
        }}
        websiteUrl={scrapeUrl || websiteUrl}
        setWebsiteUrl={(val) => {
          setScrapeUrl(val);
          if (!websiteUrl) setWebsiteUrl(val);
        }}
        extracting={extracting}
        extractionStep={extractionStep}
        extractionJobId={extractionJobId}
        onStartExtraction={handleStartExtraction}
        hasProfile={Boolean(profile && (profile.brand_name || profile.website_url))}
        extractionStatus={profile?.extraction_status}
        lastExtractedAt={profile?.last_extracted_at}
      />

      {/* 4. Brand At-A-Glance Snapshot Card */}
      {!loading && (
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

      {/* 5. Clean, Progressive 3-Tab Workspace */}
      {loading ? (
        <div className="space-y-4 pt-2">
          <div className="h-10 w-full bg-white/[0.03] animate-pulse rounded-xl border border-white/5" />
          <div className="h-80 w-full bg-white/[0.03] animate-pulse rounded-2xl border border-white/5" />
        </div>
      ) : (
        <FadeIn>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-surface border border-border p-1 h-auto flex flex-wrap gap-1 rounded-xl">
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-lg gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-foreground" />
                Identity & Voice
              </TabsTrigger>
              <TabsTrigger
                value="icp"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-lg gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Target className="h-3.5 w-3.5 text-foreground" />
                Value Props & ICP Hooks
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-medium px-4 py-2 rounded-lg gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
                Guardrails & Compliance
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTITY & VOICE */}
            <TabsContent value="voice" className="space-y-6">
              <BrandIdentityVoiceTab
                brandName={brandName}
                setBrandName={setBrandName}
                websiteUrl={websiteUrl}
                setWebsiteUrl={setWebsiteUrl}
                tagline={tagline}
                setTagline={setTagline}
                aestheticSummary={aestheticSummary}
                setAestheticSummary={setAestheticSummary}
                palettePrimary={palettePrimary}
                setPalettePrimary={setPalettePrimary}
                paletteAccent={paletteAccent}
                setPaletteAccent={setPaletteAccent}
                paletteNeutral={paletteNeutral}
                setPaletteNeutral={setPaletteNeutral}
                imageryStyle={imageryStyle}
                setImageryStyle={setImageryStyle}
                negativePrompts={negativePrompts}
                setNegativePrompts={setNegativePrompts}
                archetype={archetype}
                setArchetype={setArchetype}
                toneAttributes={toneAttributes}
                setToneAttributes={setToneAttributes}
                formattingRules={formattingRules}
                setFormattingRules={setFormattingRules}
              />
            </TabsContent>

            {/* TAB 2: VALUE PROPS & ICP */}
            <TabsContent value="icp" className="space-y-6">
              <BrandOfferingsTab
                valueProps={valueProps}
                setValueProps={setValueProps}
                icpPainPoints={icpPainPoints}
                setIcpPainPoints={setIcpPainPoints}
                leadMagnets={leadMagnets}
                setLeadMagnets={setLeadMagnets}
                ctaTemplates={ctaTemplates}
                setCtaTemplates={setCtaTemplates}
                offerHooks={offerHooks}
                setOfferHooks={setOfferHooks}
              />
            </TabsContent>

            {/* TAB 3: GUARDRAILS & COMPLIANCE */}
            <TabsContent value="compliance" className="space-y-6">
              <BrandGuardrailsTab
                bannedWords={bannedWords}
                setBannedWords={setBannedWords}
                competitorBlacklist={competitorBlacklist}
                setCompetitorBlacklist={setCompetitorBlacklist}
                sensitiveTopics={sensitiveTopics}
                setSensitiveTopics={setSensitiveTopics}
                mandatoryDisclaimers={mandatoryDisclaimers}
                setMandatoryDisclaimers={setMandatoryDisclaimers}
              />
            </TabsContent>
          </Tabs>
        </FadeIn>
      )}
    </div>
  );
}
