"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Camera, CheckCircle2, Loader2, Send, MessageSquareText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea, Select } from "@/components/ui/input";
import { WARDS } from "@/lib/demo-data";

type Language = "English" | "Hindi" | "Tamil";

interface Coords {
  latitude: number;
  longitude: number;
  ward?: string;
}

const DEMO_LOCATIONS = WARDS.filter((_, i) => i % 3 === 0); // a manageable subset for the picker

function resizeImageToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReportPage() {
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<Language>("English");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; status: string; category: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't available in this browser — pick a demo location instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location — pick a demo location instead.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImageToBase64(file);
    setImageData(resized);
    setImagePreview(`data:${resized.mimeType};base64,${resized.base64}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 3) {
      setError("Please describe the problem.");
      return;
    }
    if (!coords) {
      setError("Please set a location.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          language,
          latitude: coords.latitude,
          longitude: coords.longitude,
          ward: coords.ward,
          imageBase64: imageData?.base64,
          imageMimeType: imageData?.mimeType,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Report submitted successfully.</h1>
          <p className="mt-2 text-sm text-slate-500">Report ID</p>
          <p className="text-lg font-mono font-semibold tracking-tight">{result.code}</p>
        </div>
        <Card className="w-full">
          <CardContent className="flex items-center justify-center gap-2 py-4 text-sm">
            <span className="text-slate-400">AI Analyzing</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400">Clustered</span>
            <span className="text-slate-300">→</span>
            <span className="font-medium text-emerald-600">Prioritized</span>
          </CardContent>
        </Card>
        <p className="text-sm text-slate-500">
          Classified as <strong className="text-slate-700">{result.category}</strong>
        </p>
        <div className="flex gap-3">
          <Link href={`/report/status/${result.code}`}>
            <Button variant="outline">Check status</Button>
          </Link>
          <Button
            onClick={() => {
              setResult(null);
              setDescription("");
              setImagePreview(null);
              setImageData(null);
            }}
          >
            Submit another report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg p-6">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Report a Civic Issue</h1>
        <p className="text-sm text-slate-500">Tell us what&apos;s wrong — we&apos;ll route it to the right department.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <MessageSquareText className="h-3.5 w-3.5 text-slate-400" />
            Problem description
          </label>
          <Textarea
            rows={5}
            placeholder="E.g. No water supply on our street for three days..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            Language
          </label>
          <Select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
            <option value="English">English</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Tamil">தமிழ் (Tamil)</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            Location
          </label>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating} className="gap-2">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {locating ? "Locating…" : "Use my location"}
            </Button>
            <span className="text-center text-xs text-slate-400">or pick a demo location</span>
            <Select
              defaultValue=""
              onChange={(e) => {
                const ward = DEMO_LOCATIONS.find((w) => w.name === e.target.value);
                if (ward) setCoords({ latitude: ward.latitude, longitude: ward.longitude, ward: ward.name });
              }}
            >
              <option value="" disabled>
                Select a demo location…
              </option>
              {DEMO_LOCATIONS.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </Select>
            {coords && (
              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Location set{coords.ward ? ` — ${coords.ward}` : ""} ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <Camera className="h-3.5 w-3.5 text-slate-400" />
            Photo (optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full rounded-lg object-cover" />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </div>
  );
}
