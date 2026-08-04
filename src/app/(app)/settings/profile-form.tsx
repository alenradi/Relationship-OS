"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";

import { updateProfileAction } from "./actions";

export function ProfileForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const [name, setName] = useState(initialDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction({ displayName: name });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <Field label={copy.auth.displayName} htmlFor="settings-name">
        <Input
          id="settings-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
        />
      </Field>

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      {saved ? (
        <Notice tone="sage" role="status">
          {copy.app.saved}
        </Notice>
      ) : null}

      <Button onClick={save} disabled={pending}>
        {pending ? copy.app.saving : copy.app.save}
      </Button>
    </div>
  );
}
