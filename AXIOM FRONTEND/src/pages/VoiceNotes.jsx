/**
 * VoiceNotes.jsx
 * --------------
 * Dedicated Voice Note Structuring Studio page powered by Groq AI.
 */

import PageHeader from "../components/PageHeader";
import VoiceNoteStructurer from "../components/VoiceNoteStructurer";

export default function VoiceNotes() {
  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Voice Note Structuring Studio"
        description="Record spoken ideas, meeting notes, or debriefs. Groq's high-speed Whisper and Llama 3.3 models instantly transcribe and extract titles, summaries, takeaways, and actionable checklists."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Voice Note Structurer" }]}
      />

      <VoiceNoteStructurer />
    </div>
  );
}
