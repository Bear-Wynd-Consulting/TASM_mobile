
"use client";

import * as React from "react";
import { useActionState } from "react"; // Corrected import
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search } from "lucide-react";
import { searchScholarAction, type SearchActionResult } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const SearchFormSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .min(3, { message: "Query must be at least 3 characters long." })
    .max(300, { message: "Query can be at most 300 characters long." }),
});

type SearchFormValues = z.infer<typeof SearchFormSchema>;

interface SearchFormProps {
  onSearchStart: () => void;
  onSearchResult: (result: SearchActionResult) => void;
  initialQuery?: string | null;
}

export function SearchForm({ onSearchStart, onSearchResult, initialQuery }: SearchFormProps) {
  const [actionState, formAction, isPending] = useActionState<SearchActionResult | undefined, FormData>(
    searchScholarAction,
    undefined 
  );

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(SearchFormSchema),
    defaultValues: {
      naturalLanguageQuery: initialQuery || "",
    },
  });

  React.useEffect(() => {
    // Only reset the form field if initialQuery is provided and no action is active or completed.
    // This avoids clearing the form if the user types something after an initial query was processed.
    if (initialQuery && !actionState && !isPending) {
      form.reset({ naturalLanguageQuery: initialQuery });
    }
  }, [initialQuery, form.reset, actionState, isPending]);

  React.useEffect(() => {
    if (actionState) {
      onSearchResult(actionState);
    }
  }, [actionState, onSearchResult]);

  const onSubmit = (data: SearchFormValues) => {
    onSearchStart(); 
    const formData = new FormData();
    formData.append("naturalLanguageQuery", data.naturalLanguageQuery);
    React.startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="naturalLanguageQuery"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="naturalLanguageQuery" className="text-lg font-semibold">
                Enter your research query
              </FormLabel>
              <div className="flex flex-col md:flex-row gap-2 items-start">
                 <FormControl>
                    <Input
                    id="naturalLanguageQuery"
                    placeholder="e.g., impact of AI on climate change"
                    className="text-base"
                    {...field}
                    disabled={isPending} 
                    />
                </FormControl>
                <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
                    <Search className="mr-2 h-4 w-4" />
                    {isPending ? "Searching..." : "Search"}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {actionState?.success === false && actionState.error && !actionState.fieldErrors && (
            <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{actionState.error}</AlertDescription>
            </Alert>
        )}
      </form>
    </Form>
  );
}
