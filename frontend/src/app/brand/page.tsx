"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Globe,
  Sparkles,
  ShieldCheck,
  Palette,
  MessageSquare,
  Target,
  ArrowUpRight,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Save,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BrandProfile,
  BrandProfileUpdateRequest,
  ExtractBrandRequest,
  fetchBrandProfile,
  extractBrandFromWebsite,
  updateBrandProfile,
} from "@/lib/api-client";
import { FadeIn } from "@/lib/motion";

const ARCHETYPES = [
  "Technical Expert",
  "Visionary Leader",
  "Pragmatic Operator",
  "Challenger / Contrarian",
  "Consultative Strategist",
  "Product Specialist",
];

export default function BrandIdentityPage() {
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Scraper extraction modal
  const [extractDialogOpen, setExtractDialogOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeBrandName, setScrapeBrandName] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [extractionStep, setExtractionStep] = useState<string>("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
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
  const [newToneInput, setNewToneInput] = useState("");
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newBannedInput, setNewBannedInput] = useState("");
  const [formattingRules, setFormattingRules] = useState("");

  // Core Value Props State
  const [valueProps, setValueProps] = useState<string[]>([]);
  const [newValuePropInput, setNewValuePropInput] = useState("");

  // ICP Pain Points State
  const [icpPainPoints, setIcpPainPoints] = useState<
    { feature: string; pain_hook: string; target_persona: string }[]
  >([]);
  const [newFeature, setNewFeature] = useState("");
  const [newPainHook, setNewPainHook] = useState("");
  const [newPersona, setNewPersona] = useState("");

  // Conversion Assets State
  const [leadMagnets, setLeadMagnets] = useState<string[]>([]);
  const [newLeadMagnet, setNewLeadMagnet] = useState("");
  const [ctaTemplates, setCtaTemplates] = useState<string[]>([]);
  const [newCtaTemplate, setNewCtaTemplate] = useState("");
  const [offerHooks, setOfferHooks] = useState<string[]>([]);
  const [newOfferHook, setNewOfferHook] = useState("");

  // Compliance Policies State
  const [competitorBlacklist, setCompetitorBlacklist] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [sensitiveTopics, setSensitiveTopics] = useState<string[]>([]);
  const [newSensitiveTopic, setNewSensitiveTopic] = useState("");
  const [mandatoryDisclaimers, setMandatoryDisclaimers] = useState<string[]>([]);
  const [newDisclaimer, setNewDisclaimer] = useState("");

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
    setExtractionStep("Scraping website contents and capturing visual preview...");

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts === 5) {
        setExtractionStep("Analyzing layout structure and visual color palette...");
      } else if (attempts === 10) {
        setExtractionStep("Synthesizing brand archetype, value propositions, and pain hooks...");
      }

      try {
        const fresh = await fetchBrandProfile();
        if (fresh && fresh.extraction_status === "complete") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setProfile(fresh);
          syncFormFromProfile(fresh);
          setExtracting(false);
          setExtractDialogOpen(false);
          setExtractionStep("");
          return;
        } else if (fresh && fresh.extraction_status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setExtracting(false);
          setExtractionStep("Extraction failed on backend scraper. Please check website URL.");
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
    if (!scrapeUrl.trim() || !scrapeBrandName.trim()) return;
    setExtracting(true);
    setExtractionStep("Dispatching extraction task to crawler...");
    setErrorMessage(null);

    try {
      const payload: ExtractBrandRequest = {
        website_url: scrapeUrl.trim(),
        brand_name: scrapeBrandName.trim(),
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

  // Helper additions for lists/tags
  const addTag = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    clearInput: () => void
  ) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!currentList.includes(trimmed)) {
      setList([...currentList, trimmed]);
    }
    clearInput();
  };

  const removeTag = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    target: string
  ) => {
    setList(currentList.filter((item) => item !== target));
  };

  const addPainPoint = () => {
    if (!newFeature.trim() || !newPainHook.trim()) return;
    setIcpPainPoints([
      ...icpPainPoints,
      {
        feature: newFeature.trim(),
        pain_hook: newPainHook.trim(),
        target_persona: newPersona.trim() || "General",
      },
    ]);
    setNewFeature("");
    setNewPainHook("");
    setNewPersona("");
  };

  const removePainPoint = (index: number) => {
    setIcpPainPoints(icpPainPoints.filter((_, idx) => idx !== index));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
              Brand Identity & Policies
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
          <p className="mt-1 text-sm text-muted-foreground">
            Ground autonomous content generation in verified business positioning, voice guidelines, and compliance rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExtractDialogOpen(true)}
            className="border-white/10 hover:bg-white/[0.04] text-xs h-9 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Extract Brand from Website
          </Button>

          <Button
            onClick={handleSaveProfile}
            disabled={saving || loading}
            size="sm"
            className="bg-white text-black hover:bg-zinc-200 text-xs h-9 font-medium gap-1.5 shadow-sm"
          >
            {saving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving...
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

      {/* Global Alerts */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300 flex items-center justify-between">
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
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Brand guidelines and policies updated. New content generations will adhere to this profile.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 w-full bg-white/[0.03] animate-pulse rounded-md border border-white/5" />
          <div className="h-96 w-full bg-white/[0.03] animate-pulse rounded-xl border border-white/5" />
        </div>
      ) : (
        <FadeIn>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-[#0b0d13] border border-white/[0.08] p-1 h-auto flex flex-wrap gap-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs font-medium px-3.5 py-1.5 rounded-lg"
              >
                <Globe className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
                Core & Visuals
              </TabsTrigger>
              <TabsTrigger
                value="voice"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs font-medium px-3.5 py-1.5 rounded-lg"
              >
                <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                Voice & Guidelines
              </TabsTrigger>
              <TabsTrigger
                value="icp"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs font-medium px-3.5 py-1.5 rounded-lg"
              >
                <Target className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                Value Props & ICP
              </TabsTrigger>
              <TabsTrigger
                value="conversion"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs font-medium px-3.5 py-1.5 rounded-lg"
              >
                <ArrowUpRight className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                Conversion Assets
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-xs font-medium px-3.5 py-1.5 rounded-lg"
              >
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5 text-rose-400" />
                Compliance & Policies
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CORE & VISUALS */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Core Brand Details */}
                <Card className="md:col-span-2 border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Business Identity
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Primary company identification and website anchor used for scraping and source verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="brandName" className="text-xs font-medium text-foreground">
                          Brand / Company Name
                        </Label>
                        <Input
                          id="brandName"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="e.g. VibeAgent Technologies"
                          className="bg-black/30 border-white/10 text-sm h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="websiteUrl" className="text-xs font-medium text-foreground">
                          Website URL
                        </Label>
                        <div className="relative">
                          <Input
                            id="websiteUrl"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://acme.ai"
                            className="bg-black/30 border-white/10 text-sm h-9 pr-8"
                          />
                          {websiteUrl && (
                            <a
                              href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-white"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="tagline" className="text-xs font-medium text-foreground">
                        Tagline / Positioning Statement
                      </Label>
                      <Input
                        id="tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="e.g. Autonomous social marketing infrastructure for enterprise B2B teams"
                        className="bg-black/30 border-white/10 text-sm h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="aestheticSummary" className="text-xs font-medium text-foreground">
                        Aesthetic & Market Summary
                      </Label>
                      <Textarea
                        id="aestheticSummary"
                        rows={3}
                        value={aestheticSummary}
                        onChange={(e) => setAestheticSummary(e.target.value)}
                        placeholder="Brief summary of your design aesthetic, product category, and positioning tone extracted from website."
                        className="bg-black/30 border-white/10 text-sm resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Visual Palette & Preview */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                      <span>Visual Palette</span>
                      <Palette className="h-4 w-4 text-cyan-400" />
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Color tokens referenced by multimodal image synthesis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Color Swatch Display */}
                    <div className="flex h-12 w-full rounded-lg overflow-hidden border border-white/10 shadow-inner">
                      <div
                        className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-white/90 drop-shadow"
                        style={{ backgroundColor: palettePrimary }}
                        title="Primary Color"
                      >
                        Primary
                      </div>
                      <div
                        className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-black/80 drop-shadow"
                        style={{ backgroundColor: paletteAccent }}
                        title="Accent Color"
                      >
                        Accent
                      </div>
                      <div
                        className="flex-1 flex items-center justify-center text-[10px] font-mono font-medium text-black/80 drop-shadow"
                        style={{ backgroundColor: paletteNeutral }}
                        title="Neutral Color"
                      >
                        Neutral
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Primary</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={palettePrimary}
                            onChange={(e) => setPalettePrimary(e.target.value)}
                            className="h-6 w-6 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-foreground">{palettePrimary}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Accent</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={paletteAccent}
                            onChange={(e) => setPaletteAccent(e.target.value)}
                            className="h-6 w-6 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-foreground">{paletteAccent}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs text-muted-foreground">Neutral</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={paletteNeutral}
                            onChange={(e) => setPaletteNeutral(e.target.value)}
                            className="h-6 w-6 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-foreground">{paletteNeutral}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.08] pt-3 space-y-1.5">
                      <Label htmlFor="imageryStyle" className="text-xs font-medium text-foreground">
                        Imagery Style
                      </Label>
                      <Input
                        id="imageryStyle"
                        value={imageryStyle}
                        onChange={(e) => setImageryStyle(e.target.value)}
                        placeholder="e.g. Isometric 3D dark-mode telemetry"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="negativePrompts" className="text-xs font-medium text-foreground">
                        Avoid in Visuals
                      </Label>
                      <Input
                        id="negativePrompts"
                        value={negativePrompts}
                        onChange={(e) => setNegativePrompts(e.target.value)}
                        placeholder="e.g. cartoonish, cluttered, vintage"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: VOICE & GUIDELINES */}
            <TabsContent value="voice" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Archetype & Tone Attributes */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Voice Persona & Archetype
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Defines the intellectual stance and emotional resonance of generated copy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Primary Written Archetype
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {ARCHETYPES.map((arch) => (
                          <button
                            key={arch}
                            type="button"
                            onClick={() => setArchetype(arch)}
                            className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                              archetype === arch
                                ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                                : "border-white/10 bg-black/20 text-muted-foreground hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {arch}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.08] pt-4 space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Tone Attributes
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={newToneInput}
                          onChange={(e) => setNewToneInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag(toneAttributes, setToneAttributes, newToneInput, () => setNewToneInput(""));
                            }
                          }}
                          placeholder="e.g. Pragmatic, Direct, Data-dense"
                          className="bg-black/30 border-white/10 text-xs h-8"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addTag(toneAttributes, setToneAttributes, newToneInput, () => setNewToneInput(""))}
                          className="h-8 border-white/10 hover:bg-white/5 text-xs px-2.5"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {toneAttributes.map((attr) => (
                          <Badge
                            key={attr}
                            variant="secondary"
                            className="bg-white/5 border border-white/10 text-xs text-foreground py-1 px-2.5 gap-1.5"
                          >
                            <span>{attr}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(toneAttributes, setToneAttributes, attr)}
                              className="text-muted-foreground hover:text-rose-400"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {toneAttributes.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            No tone attributes specified. Type above and press Add.
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Banned Words & Formatting Rules */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Banned Words & Formatting Rules
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Hard guardrails that the AI must never violate in output content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Banned Buzzwords & Phrases (Strict Negative Constraint)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={newBannedInput}
                          onChange={(e) => setNewBannedInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag(bannedWords, setBannedWords, newBannedInput, () => setNewBannedInput(""));
                            }
                          }}
                          placeholder="e.g. synergy, game-changer, delve into"
                          className="bg-black/30 border-white/10 text-xs h-8"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addTag(bannedWords, setBannedWords, newBannedInput, () => setNewBannedInput(""))}
                          className="h-8 border-white/10 hover:bg-white/5 text-xs px-2.5"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bannedWords.map((word) => (
                          <Badge
                            key={word}
                            variant="secondary"
                            className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 py-1 px-2.5 gap-1.5"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => removeTag(bannedWords, setBannedWords, word)}
                              className="text-rose-400 hover:text-white"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {bannedWords.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            No banned words set. Enter buzzwords to exclude.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/[0.08] pt-4 space-y-1.5">
                      <Label htmlFor="formattingRules" className="text-xs font-medium text-foreground">
                        Post Structure & Formatting Instructions
                      </Label>
                      <Textarea
                        id="formattingRules"
                        rows={4}
                        value={formattingRules}
                        onChange={(e) => setFormattingRules(e.target.value)}
                        placeholder="e.g. 1-line hook, 2-line paragraphs, max 2 emojis per post, end with question CTA."
                        className="bg-black/30 border-white/10 text-xs resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: VALUE PROPS & ICP */}
            <TabsContent value="icp" className="space-y-6">
              {/* Value Propositions */}
              <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Core Value Propositions
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Strategic selling points highlighted across generated campaigns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newValuePropInput}
                      onChange={(e) => setNewValuePropInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(valueProps, setValueProps, newValuePropInput, () => setNewValuePropInput(""));
                        }
                      }}
                      placeholder="e.g. Sub-second qualification latency with zero human intervention required"
                      className="bg-black/30 border-white/10 text-sm h-9"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addTag(valueProps, setValueProps, newValuePropInput, () => setNewValuePropInput(""))}
                      className="h-9 px-3 gap-1.5 text-xs bg-white text-black hover:bg-zinc-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Value Prop
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {valueProps.map((prop, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/20 text-sm text-foreground"
                      >
                        <span className="flex-1 pr-3 leading-relaxed">{prop}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setValueProps(valueProps.filter((_, i) => i !== idx))}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {valueProps.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-lg">
                        No value propositions registered. Use the extraction tool or add items above.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ICP Pain Points Matrix */}
              <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold text-foreground">
                    ICP Pain Points & Hook Matrix
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Pair concrete product features with painful customer symptoms and target personas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Pain Point Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg border border-white/5 bg-black/30">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Product Feature (e.g. Durable Orchestration)"
                      className="bg-black/40 border-white/10 text-xs h-8"
                    />
                    <Input
                      value={newPainHook}
                      onChange={(e) => setNewPainHook(e.target.value)}
                      placeholder="Pain Hook (e.g. Dropping webhooks at 3 AM)"
                      className="bg-black/40 border-white/10 text-xs h-8"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={newPersona}
                        onChange={(e) => setNewPersona(e.target.value)}
                        placeholder="Persona (e.g. Series B Backend Leads)"
                        className="bg-black/40 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addPainPoint}
                        className="h-8 px-2.5 text-xs bg-white text-black hover:bg-zinc-200"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Matrix Table */}
                  <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-b border-white/[0.08]">
                          <TableHead className="text-xs font-semibold text-muted-foreground w-1/4">
                            Feature
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground w-2/4">
                            Pain Hook
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-muted-foreground w-1/4">
                            Target Persona
                          </TableHead>
                          <TableHead className="text-xs text-right w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {icpPainPoints.map((item, idx) => (
                          <TableRow key={idx} className="border-b border-white/[0.05]">
                            <TableCell className="text-xs font-medium text-foreground py-2.5">
                              {item.feature}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-2.5">
                              &ldquo;{item.pain_hook}&rdquo;
                            </TableCell>
                            <TableCell className="text-xs text-foreground py-2.5">
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px]">
                                {item.target_persona}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right py-2.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePainPoint(idx)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {icpPainPoints.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                              No ICP pain hooks registered. Add one above.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: CONVERSION ASSETS */}
            <TabsContent value="conversion" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lead Magnets */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Lead Magnets
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Free assets, checklists, benchmarks, or calculators.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newLeadMagnet}
                        onChange={(e) => setNewLeadMagnet(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(leadMagnets, setLeadMagnets, newLeadMagnet, () => setNewLeadMagnet(""));
                          }
                        }}
                        placeholder="e.g. Free 2026 AI Outbound Benchmark"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTag(leadMagnets, setLeadMagnets, newLeadMagnet, () => setNewLeadMagnet(""))}
                        className="h-8 border-white/10 px-2.5"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {leadMagnets.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border border-white/5 bg-black/20 text-xs text-foreground"
                        >
                          <span className="truncate pr-2">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(leadMagnets, setLeadMagnets, item)}
                            className="text-muted-foreground hover:text-rose-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {leadMagnets.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">None added.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Templates */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      CTA Templates
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Social post sign-offs and comment hooks.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newCtaTemplate}
                        onChange={(e) => setNewCtaTemplate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(ctaTemplates, setCtaTemplates, newCtaTemplate, () => setNewCtaTemplate(""));
                          }
                        }}
                        placeholder="e.g. Comment 'SCALE' and I'll DM you the breakdown"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTag(ctaTemplates, setCtaTemplates, newCtaTemplate, () => setNewCtaTemplate(""))}
                        className="h-8 border-white/10 px-2.5"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {ctaTemplates.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border border-white/5 bg-black/20 text-xs text-foreground"
                        >
                          <span className="truncate pr-2">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(ctaTemplates, setCtaTemplates, item)}
                            className="text-muted-foreground hover:text-rose-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {ctaTemplates.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">None added.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Offer Hooks */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Offer Hooks
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Trial periods, consultations, and pilot packages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newOfferHook}
                        onChange={(e) => setNewOfferHook(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(offerHooks, setOfferHooks, newOfferHook, () => setNewOfferHook(""));
                          }
                        }}
                        placeholder="e.g. 14-day free pilot, no card required"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTag(offerHooks, setOfferHooks, newOfferHook, () => setNewOfferHook(""))}
                        className="h-8 border-white/10 px-2.5"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {offerHooks.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded border border-white/5 bg-black/20 text-xs text-foreground"
                        >
                          <span className="truncate pr-2">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(offerHooks, setOfferHooks, item)}
                            className="text-muted-foreground hover:text-rose-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {offerHooks.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">None added.</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 5: COMPLIANCE & POLICIES */}
            <TabsContent value="compliance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Competitor Blacklist */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                      <span>Competitor Blacklist</span>
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Competitor names or brand trademarks the AI must never mention, validate, or endorse.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newCompetitor}
                        onChange={(e) => setNewCompetitor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(competitorBlacklist, setCompetitorBlacklist, newCompetitor, () => setNewCompetitor(""));
                          }
                        }}
                        placeholder="e.g. CompetitorCorp, RivalAI"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTag(competitorBlacklist, setCompetitorBlacklist, newCompetitor, () => setNewCompetitor(""))}
                        className="h-8 border-white/10 text-xs px-2.5"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {competitorBlacklist.map((comp) => (
                        <Badge
                          key={comp}
                          variant="secondary"
                          className="bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 py-1 px-2.5 gap-1.5"
                        >
                          <span>{comp}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(competitorBlacklist, setCompetitorBlacklist, comp)}
                            className="text-rose-400 hover:text-white"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {competitorBlacklist.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No competitor constraints set.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sensitive Topics */}
                <Card className="border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                      <span>Off-Limits & Sensitive Topics</span>
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Subjects, unannounced internal roadmaps, or controversies off-limits in marketing copy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newSensitiveTopic}
                        onChange={(e) => setNewSensitiveTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(sensitiveTopics, setSensitiveTopics, newSensitiveTopic, () => setNewSensitiveTopic(""));
                          }
                        }}
                        placeholder="e.g. Unreleased pricing changes, internal metrics"
                        className="bg-black/30 border-white/10 text-xs h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTag(sensitiveTopics, setSensitiveTopics, newSensitiveTopic, () => setNewSensitiveTopic(""))}
                        className="h-8 border-white/10 text-xs px-2.5"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sensitiveTopics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 py-1 px-2.5 gap-1.5"
                        >
                          <span>{topic}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(sensitiveTopics, setSensitiveTopics, topic)}
                            className="text-amber-400 hover:text-white"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      {sensitiveTopics.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No sensitive topics specified.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mandatory Disclaimers */}
                <Card className="md:col-span-2 border-white/[0.08] bg-[#0c0e14]/70">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Mandatory Disclaimers & Legal Disclosures
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Statements or legal notices the AI must respect or append where statements involve regulatory claims.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newDisclaimer}
                        onChange={(e) => setNewDisclaimer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag(mandatoryDisclaimers, setMandatoryDisclaimers, newDisclaimer, () => setNewDisclaimer(""));
                          }
                        }}
                        placeholder="e.g. Past performance does not guarantee future results. Not intended as financial advice."
                        className="bg-black/30 border-white/10 text-sm h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addTag(mandatoryDisclaimers, setMandatoryDisclaimers, newDisclaimer, () => setNewDisclaimer(""))}
                        className="h-9 px-3 gap-1.5 text-xs bg-white text-black hover:bg-zinc-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Disclaimer
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {mandatoryDisclaimers.map((disc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/20 text-xs text-foreground"
                        >
                          <span className="flex-1 pr-3 leading-relaxed">{disc}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMandatoryDisclaimers(mandatoryDisclaimers.filter((_, i) => i !== idx))}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {mandatoryDisclaimers.length === 0 && (
                        <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-lg">
                          No mandatory disclaimers configured.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </FadeIn>
      )}

      {/* MODAL: Extract Brand from Website */}
      <Dialog open={extractDialogOpen} onOpenChange={setExtractDialogOpen}>
        <DialogContent className="max-w-md bg-[#0c0e14] border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Extract Brand from Website
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide your public landing page. The Crawl4AI worker crawls the DOM, captures a visual screenshot, and synthesizes brand voice and conversion hooks using multimodal LLMs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="scrapeBrandName" className="text-xs font-medium">
                Brand / Product Name
              </Label>
              <Input
                id="scrapeBrandName"
                value={scrapeBrandName}
                onChange={(e) => setScrapeBrandName(e.target.value)}
                placeholder="e.g. Acme Cloud"
                disabled={extracting}
                className="bg-black/30 border-white/10 text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scrapeUrl" className="text-xs font-medium">
                Website URL to Scrape
              </Label>
              <Input
                id="scrapeUrl"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
                placeholder="https://acme.ai"
                disabled={extracting}
                className="bg-black/30 border-white/10 text-sm h-9"
              />
            </div>

            {extracting && (
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Autonomous Extraction in Progress</span>
                </div>
                <p className="text-xs text-muted-foreground pl-5.5">{extractionStep}</p>
                {extractionJobId && (
                  <p className="text-[10px] text-muted-foreground/60 font-mono pl-5.5">
                    Job ID: {extractionJobId}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExtractDialogOpen(false)}
              disabled={extracting}
              className="border-white/10 text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleStartExtraction}
              disabled={extracting || !scrapeUrl.trim() || !scrapeBrandName.trim()}
              className="bg-white text-black hover:bg-zinc-200 text-xs h-9 gap-1.5 font-medium"
            >
              {extracting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                  Start Extraction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
