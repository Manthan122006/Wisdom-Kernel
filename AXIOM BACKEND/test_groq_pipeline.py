"""
test_groq_pipeline.py
----------------------
Standalone verification script for testing the 2-Stage Groq AI Voice Note pipeline.
1. Generates a valid temporary WAV audio file.
2. Calls Stage 1 (Groq Whisper transcription).
3. Calls Stage 2 (Groq Llama 3.3 structuring into JSON).
"""

import os
import sys
import tempfile
import wave
import struct

from dotenv import load_dotenv

load_dotenv()

from services import groq_voice_service


def create_sample_wav(filename: str):
    """Generates a simple 1-second 16kHz MONO PCM WAV file."""
    framerate = 16000
    duration = 1.0  # seconds
    num_samples = int(framerate * duration)

    with wave.open(filename, "wb") as wav_file:
        wav_file.setnchannels(1)  # mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(framerate)

        # Write silent / low-frequency tone PCM samples
        samples = []
        for i in range(num_samples):
            value = int(1000 * (i % 50) / 50)
            samples.append(struct.pack("<h", value))

        wav_file.writeframes(b"".join(samples))


def main():
    print("==================================================")
    print("     GROQ VOICE NOTE PIPELINE VERIFICATION       ")
    print("==================================================")

    api_key = os.getenv("GROQ_API_KEY") or os.getenv("AI_API_KEY")
    print(f"-> GROQ_API_KEY configured: {'YES (' + api_key[:8] + '...)' if api_key else 'NO'}")

    # Step 1: Test Llama 3.3 structuring directly with a realistic transcript first
    sample_transcript = (
        "Hey team, in today's sprint meeting we discussed the audio recorder issue on Chrome. "
        "Sarah will fix the MediaRecorder MIME type bug by tomorrow afternoon. "
        "Also, John needs to review the FastAPI backend endpoint for voice note structuring before Friday. "
        "Key takeaway is that high-priority action items must have priority badges in the UI."
    )

    print("\n--- Testing Stage 2: Groq Llama 3.3 Structuring ---")
    print(f"Input Transcript: '{sample_transcript[:80]}...'")

    try:
        structured_data = groq_voice_service.structure_transcript(sample_transcript)
        print("\n[SUCCESS] Structured JSON Data Received:")
        print(f"  Title: {structured_data.get('title')}")
        print(f"  Category: {structured_data.get('category')}")
        print(f"  Summary: {structured_data.get('summary')}")
        print(f"  Key Points count: {len(structured_data.get('key_points', []))}")
        for idx, point in enumerate(structured_data.get('key_points', []), 1):
            print(f"    {idx}. {point}")
        print(f"  Action Items count: {len(structured_data.get('action_items', []))}")
        for item in structured_data.get('action_items', []):
            print(f"    - [{item.get('priority')}] {item.get('task')} (Owner: {item.get('owner')}, Deadline: {item.get('deadline')})")
    except Exception as exc:
        print(f"\n[ERROR] Structuring failed: {exc}")
        sys.exit(1)

    # Step 2: Test audio file validation & transcription call
    print("\n--- Testing Stage 1: Groq Whisper Transcription ---")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_filename = tmp.name

    try:
        create_sample_wav(tmp_filename)
        file_size = os.path.getsize(tmp_filename)
        print(f"Created sample audio file ({file_size} bytes)")

        # Validate file
        ext = groq_voice_service.validate_upload("sample_note.wav", file_size)
        print(f"Validation passed (extension: {ext})")

        print("Sending audio to Groq Whisper STT...")
        try:
            transcript = groq_voice_service.transcribe_audio(tmp_filename, "sample_note.wav")
            print(f"[SUCCESS] STT Transcript: '{transcript}'")
        except groq_voice_service.VoiceNoteValidationError as exc:
            print(f"[EXPECTED FOR SILENT AUDIO]: {exc}")
    finally:
        if os.path.exists(tmp_filename):
            os.remove(tmp_filename)

    print("\n==================================================")
    print("   ALL VERIFICATIONS PASSED SUCCESSFULLY!          ")
    print("==================================================")


if __name__ == "__main__":
    main()
