
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
// import {toast} from '@/components/ui/toast'; // useToast hook already provides toast
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  signInWithCredential
  // getAuth // No longer need to import getAuth here directly
} from 'firebase/auth';
import { FirebaseUser, auth } from '@/lib/firebase'; // auth is imported here and is correctly initialized
import * as React from "react";
import { useSearchParams } from 'next/navigation';
import { SearchForm } from "@/components/SearchForm";
import { ArticleCard } from "@/components/ArticleCard";
import { ScholarChatLogo } from "@/components/ScholarChatLogo";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { SearchActionResult, Article, SummarizeArticlesResult, GenerateOverallSummaryResult, GenerateFactsForKidsResult, GenerateArticleRelationsResult, ArticleRelationItem } from "./actions";
import { searchScholarAction, getArticleSummariesAction, getOverallSummaryAction, getFactsForKidsAction, getArticleRelationsAction } from "./actions";
import { ExternalLink, AlertCircle, CheckCircle2, Sparkles, Library, Lightbulb, BookCopy, Share2, BookMarked, LogIn, LogOut, FileJson, Sheet as SheetIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArticleRelationshipVisual } from "@/components/ArticleRelationshipVisual";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { initializeGIS, renderGoogleSignInButton, requestSheetsAuthorization, requestNotebookLMAuthorization } from '@/lib/google-identity-services';

// const auth = getAuth(); // REMOVED: This was causing the issue by re-declaring auth without an app instance.

interface SearchResultState {
  naturalLanguageQuery?: string;
  translatedQuery?: string;
  googleScholarSearchLink?: string;
  articles: Article[];
  error?: string;
  isLoading: boolean;
  searchPerformed: boolean;
  isSummarizingIndividual: boolean;
  individualSummarizationError?: string;
  overallSummary?: string;
  isGeneratingOverallSummary: boolean;
  overallSummaryError?: string;
  isGeneratingFactsForKids: boolean;
  factsForKidsContent?: string;
  factsForKidsError?: string;
  isGeneratingRelations: boolean;
  articleRelations?: ArticleRelationItem[];
  articleRelationsError?: string;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const [initialQueryProcessed, setInitialQueryProcessed] = React.useState(false);
  const { toast } = useToast();

  const [searchState, setSearchState] = React.useState<SearchResultState>({
    articles: [],
    isLoading: false,
    searchPerformed: false,
    isSummarizingIndividual: false,
    overallSummary: undefined,
    isGeneratingOverallSummary: false,
    overallSummaryError: undefined,
    isGeneratingFactsForKids: false,
    factsForKidsContent: undefined,
    factsForKidsError: undefined,
    isGeneratingRelations: false,
    articleRelations: undefined,
    articleRelationsError: undefined,
  });

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isSheetsAuthorized, setIsSheetsAuthorized] = useState(false);
  const [isNotebookLMAuthorized, setIsNotebookLMAuthorized] = useState(false);

  const checkGoogleSheetsAuthorizationStatus = useCallback(async () => {
      if (!auth.currentUser) return;
      // Placeholder - implement real check
      // const response = await fetch('/api/check-sheets-auth?uid=' + auth.currentUser.uid);
      // const data = await response.json();
      // setIsSheetsAuthorized(data.isAuthorized);
      setIsSheetsAuthorized(false); // Assuming not authorized by default after login
  }, []); // auth is stable from import, so no explicit dependency needed here

  const checkNotebookLMAuthorizationStatus = useCallback(async () => {
      if (!auth.currentUser) return;
      // Placeholder - implement real check
      setIsNotebookLMAuthorized(false); // Assuming not authorized by default after login
  }, []); // auth is stable from import

  const handleGoogleSignInCredential = useCallback(async (response: any) => {
      if (response.credential) {
          const idToken = response.credential;
          const credential = GoogleAuthProvider.credential(idToken);
          try {
              await signInWithCredential(auth, credential);
              toast({ title: "Signed In", description: "Successfully signed in with Google." });
              // After sign-in, check existing authorizations or prompt as needed.
              // For now, we assume they need to authorize separately.
              checkGoogleSheetsAuthorizationStatus();
              checkNotebookLMAuthorizationStatus();
          } catch (error: any) {
              console.error("Error signing in with Firebase with Google credential:", error);
              toast({ title: "Sign In Failed", description: error.message || "An error occurred during sign in.", variant: "destructive" });
          }
      }
  }, [toast, checkGoogleSheetsAuthorizationStatus, checkNotebookLMAuthorizationStatus]);


  useEffect(() => {
      if (typeof window !== 'undefined') {
          initializeGIS(handleGoogleSignInCredential);
          if (document.getElementById("google-sign-in-button-div")) {
            renderGoogleSignInButton("google-sign-in-button-div", handleGoogleSignInCredential);
          }
      }
  }, [handleGoogleSignInCredential]);


  useEffect(() => {
      if (currentUser) {
          // Re-check authorization status when user changes (e.g., after page load and auth state confirmed)
          checkGoogleSheetsAuthorizationStatus();
          checkNotebookLMAuthorizationStatus();
      } else {
          setIsSheetsAuthorized(false);
          setIsNotebookLMAuthorized(false);
      }
  }, [currentUser, checkGoogleSheetsAuthorizationStatus, checkNotebookLMAuthorizationStatus]);


  const handleAuthorizeSheets = () => {
      if (!currentUser) {
          toast({ title: "Sign In Required", description: "Please sign in first.", variant: "destructive" });
          return;
      }
      requestSheetsAuthorization((response: any) => {
          // This callback receives the authorization code or error from Google's OAuth flow
          // Ideally, you'd send this code to your backend to exchange for tokens.
          // For now, we'll just log it and inform the user.
          console.log("Sheets authorization flow response:", response);
          if (response.code) {
            toast({ title: "Authorization Code Received", description: "Processing Sheets authorization..." });
            // TODO: Send response.code to backend to get tokens and set isSheetsAuthorized
          } else if (response.error) {
            toast({ title: "Sheets Authorization Failed", description: response.error_description || response.error, variant: "destructive" });
          } else {
            toast({ title: "Authorization Started", description: "Please follow the prompts from Google." });
          }
      });
  };

  const handleAuthorizeNotebookLM = () => {
      if (!currentUser) {
          toast({ title: "Sign In Required", description: "Please sign in first.", variant: "destructive" });
          return;
      }
      requestNotebookLMAuthorization((response: any) => {
        console.log("NotebookLM authorization flow response:", response);
          if (response.code) {
            toast({ title: "Authorization Code Received", description: "Processing NotebookLM authorization..." });
            // TODO: Send response.code to backend to get tokens and set isNotebookLMAuthorized
          } else if (response.error) {
            toast({ title: "NotebookLM Authorization Failed", description: response.error_description || response.error, variant: "destructive" });
          } else {
            toast({ title: "Authorization Started", description: "Please follow the prompts from Google." });
          }
      });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (!user) { // If user signs out, or initially no user
        if (document.getElementById("google-sign-in-button-div")) {
           renderGoogleSignInButton("google-sign-in-button-div", handleGoogleSignInCredential);
        }
      }
    });
    return () => unsubscribe();
  }, [handleGoogleSignInCredential]);


  const handleSearchStart = React.useCallback(() => {
    setSearchState(prevState => ({
      naturalLanguageQuery: prevState.naturalLanguageQuery,
      articles: [],
      isLoading: true,
      searchPerformed: true,
      error: undefined,
      translatedQuery: undefined,
      googleScholarSearchLink: undefined,
      isSummarizingIndividual: false,
      individualSummarizationError: undefined,
      overallSummary: undefined,
      isGeneratingOverallSummary: false,
      overallSummaryError: undefined,
      isGeneratingFactsForKids: false,
      factsForKidsContent: undefined,
      factsForKidsError: undefined,
      isGeneratingRelations: false,
      articleRelations: undefined,
      articleRelationsError: undefined,
    }));
  }, []);

  const handleSearchResult = React.useCallback((result: SearchActionResult) => {
     if (result.success && result.data) {
      setSearchState(prevState => ({
        ...prevState,
        naturalLanguageQuery: result.data.naturalLanguageQuery,
        translatedQuery: result.data.translatedQuery,
        googleScholarSearchLink: result.data.googleScholarSearchLink,
        articles: result.data.articles,
        isLoading: false,
        error: undefined,
        searchPerformed: true,
      }));
    } else {
      setSearchState(prevState => ({
        ...prevState,
        isLoading: false,
        error: result.error || "An unknown error occurred.",
        searchPerformed: true,
        naturalLanguageQuery: result.fieldErrors?.naturalLanguageQuery?.[0] ? prevState.naturalLanguageQuery : (prevState.naturalLanguageQuery || (result.data?.naturalLanguageQuery)),

      }));
    }
  }, []);

  React.useEffect(() => {
    const queryFromUrl = searchParams.get('q');

    if (queryFromUrl && !initialQueryProcessed && !searchState.isLoading && !searchState.searchPerformed) {
      setInitialQueryProcessed(true);

      const performInitialSearch = async () => {
        setSearchState(prevState => ({ ...prevState, naturalLanguageQuery: queryFromUrl, isLoading: true, searchPerformed: true, error: undefined }));

        const formData = new FormData();
        formData.append('naturalLanguageQuery', queryFromUrl);
        const result = await searchScholarAction(undefined, formData);
        handleSearchResult(result);
      };

      performInitialSearch();
    }
  }, [searchParams, initialQueryProcessed, searchState.isLoading, searchState.searchPerformed, handleSearchResult]);


  const handleSummarizeAndSynthesize = React.useCallback(async () => {
    if (!searchState.translatedQuery || searchState.articles.length === 0) return;

    setSearchState(prevState => ({
      ...prevState,
      isSummarizingIndividual: true,
      individualSummarizationError: undefined,
      isGeneratingOverallSummary: false,
      overallSummaryError: undefined,
      overallSummary: undefined,
      factsForKidsContent: undefined,
      factsForKidsError: undefined,
      isGeneratingFactsForKids: false,
      articleRelations: undefined,
      articleRelationsError: undefined,
      isGeneratingRelations: false,
    }));

    try {
      const articlesToSummarize = searchState.articles.map(a => ({ title: a.title, link: a.link }));
      const individualSummariesResult: SummarizeArticlesResult = await getArticleSummariesAction({
        articlesToSummarize,
        queryContext: searchState.translatedQuery,
      });

      let updatedArticlesWithSummaries = [...searchState.articles];

      if (individualSummariesResult.success && individualSummariesResult.summaries) {
        updatedArticlesWithSummaries = searchState.articles.map((article, index) => ({
          ...article,
          summary: individualSummariesResult.summaries![index] || "Summary not available.",
        }));
        setSearchState(prevState => ({
          ...prevState,
          articles: updatedArticlesWithSummaries,
          isSummarizingIndividual: false,
        }));

        setSearchState(prevState => ({
          ...prevState,
          isGeneratingOverallSummary: true,
          overallSummaryError: undefined,
        }));

        const articleSummariesForOverall = updatedArticlesWithSummaries
          .filter(a => a.summary && a.summary !== "Summary not available.")
          .map(a => ({ title: a.title, summary: a.summary! }));

        if (articleSummariesForOverall.length > 0) {
          const overallSummaryResult: GenerateOverallSummaryResult = await getOverallSummaryAction({
            queryContext: searchState.translatedQuery,
            articleSummaries: articleSummariesForOverall,
          });

          if (overallSummaryResult.success && overallSummaryResult.overallSummary) {
            setSearchState(prevState => ({
              ...prevState,
              overallSummary: overallSummaryResult.overallSummary,
              isGeneratingOverallSummary: false,
            }));
          } else {
            setSearchState(prevState => ({
              ...prevState,
              isGeneratingOverallSummary: false,
              overallSummaryError: overallSummaryResult.error || "Failed to generate overall summary.",
            }));
          }
        } else {
           setSearchState(prevState => ({
            ...prevState,
            isGeneratingOverallSummary: false,
            overallSummaryError: "No valid individual summaries available to create an overall summary.",
          }));
        }

      } else {
        setSearchState(prevState => ({
          ...prevState,
          isSummarizingIndividual: false,
          individualSummarizationError: individualSummariesResult.error || "Failed to get individual summaries.",
          isGeneratingOverallSummary: false,
        }));
      }
    } catch (error) {
      console.error("Error in handleSummarizeAndSynthesize:", error);
      setSearchState(prevState => ({
        ...prevState,
        isSummarizingIndividual: false,
        individualSummarizationError: "An unexpected error occurred during individual summarization.",
        isGeneratingOverallSummary: false,
        overallSummaryError: "Overall summarization could not proceed due to an earlier error.",
      }));
    }
  }, [searchState.translatedQuery, searchState.articles]);

  const handleGenerateFactsForKids = React.useCallback(async () => {
    if (!searchState.overallSummary || !searchState.naturalLanguageQuery) return;

    setSearchState(prevState => ({
      ...prevState,
      isGeneratingFactsForKids: true,
      factsForKidsContent: undefined,
      factsForKidsError: undefined,
    }));

    try {
      const result: GenerateFactsForKidsResult = await getFactsForKidsAction({
        queryContext: searchState.naturalLanguageQuery,
        overallSummary: searchState.overallSummary,
      });

      if (result.success && result.factsForKidsText) {
        setSearchState(prevState => ({
          ...prevState,
          factsForKidsContent: result.factsForKidsText,
          isGeneratingFactsForKids: false,
        }));
      } else {
        setSearchState(prevState => ({
          ...prevState,
          factsForKidsError: result.error || "Failed to generate facts for kids.",
          isGeneratingFactsForKids: false,
        }));
      }
    } catch (error) {
      console.error("Error in handleGenerateFactsForKids:", error);
      setSearchState(prevState => ({
        ...prevState,
        factsForKidsError: "An unexpected error occurred while generating facts for kids.",
        isGeneratingFactsForKids: false,
      }));
    }
  }, [searchState.overallSummary, searchState.naturalLanguageQuery]);

  const handleGenerateArticleRelations = React.useCallback(async () => {
    if (!searchState.translatedQuery || searchState.articles.some(a => !a.summary)) {
      setSearchState(prevState => ({
        ...prevState,
        articleRelationsError: "Cannot generate relations: Not all articles have summaries, or search context is missing. Please ensure summaries are generated first.",
      }));
      return;
    }

    setSearchState(prevState => ({
      ...prevState,
      isGeneratingRelations: true,
      articleRelations: undefined,
      articleRelationsError: undefined,
    }));

    const articlesForRelations = searchState.articles
      .filter(article => article.summary && article.summary !== "Summary not available.")
      .map(article => ({ title: article.title, summary: article.summary! }));

    if (articlesForRelations.length === 0) {
       setSearchState(prevState => ({
        ...prevState,
        isGeneratingRelations: false,
        articleRelationsError: "No articles with summaries available to generate relations.",
      }));
      return;
    }

    try {
      const result: GenerateArticleRelationsResult = await getArticleRelationsAction({
        queryContext: searchState.translatedQuery,
        articles: articlesForRelations,
      });

      if (result.success && result.relations) {
        setSearchState(prevState => ({
          ...prevState,
          articleRelations: result.relations,
          isGeneratingRelations: false,
        }));
      } else {
        setSearchState(prevState => ({
          ...prevState,
          articleRelationsError: result.error || "Failed to generate article relations.",
          isGeneratingRelations: false,
        }));
      }
    } catch (error) {
      console.error("Error in handleGenerateArticleRelations:", error);
      setSearchState(prevState => ({
        ...prevState,
        articleRelationsError: "An unexpected error occurred while generating article relations.",
        isGeneratingRelations: false,
      }));
    }
  }, [searchState.translatedQuery, searchState.articles]);

  const handleExportToNotebookLM = React.useCallback(async () => {
    if (!searchState.overallSummary && searchState.articles.length === 0) {
      toast({
        title: "Error",
        description: "No summary or articles available to save to NotebookLM.",
        variant: "destructive",
      });
      return;
    }
     if (currentUser && !isNotebookLMAuthorized) {
        toast({ title: "Authorization Required", description: "Please authorize NotebookLM access first via the profile section.", variant: "destructive" });
        return;
    }

    let contentToExport = "";
    let toastTitle = "";
    let toastDescription = "";

    if (currentUser) {
      contentToExport = `# Research: ${searchState.naturalLanguageQuery || 'N/A'}\n\n`;
      if (searchState.overallSummary) {
        contentToExport += `## Overall Synthesis\n${searchState.overallSummary}\n\n`;
      }

      if (searchState.articles && searchState.articles.length > 0) {
        contentToExport += `## Articles & Summaries\n\n`;
        searchState.articles.forEach(article => {
          contentToExport += `**Title:** ${article.title}\n`;
          contentToExport += `**Link:** ${article.link}\n`;
          contentToExport += `**Summary:** ${article.summary || "Not available."}\n---\n`;
        });
      }
      toastTitle = "Research Data Copied!";
      toastDescription = "Query, overall summary, and article details copied for NotebookLM.";
    } else {
      // If not signed in, only export overall summary if available
      if (searchState.overallSummary) {
          contentToExport = searchState.overallSummary;
          toastTitle = "Summary Copied!";
          toastDescription = "The overall summary has been copied for NotebookLM.";
      } else {
           toast({
            title: "No Summary",
            description: "No overall summary available to copy. Sign in to copy article details.",
            variant: "destructive",
          });
          return;
      }
    }

    try {
      await navigator.clipboard.writeText(contentToExport);
      toast({
        title: toastTitle,
        description: toastDescription,
      });
      window.open("https://notebooklm.google.com/", "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to copy to clipboard: ", err);
      toast({
        title: "Copy Failed",
        description: "Could not copy the content to clipboard. Please try manually.",
        variant: "destructive",
      });
      window.open("https://notebooklm.google.com/", "_blank", "noopener,noreferrer");
    }
  }, [currentUser, isNotebookLMAuthorized, searchState.naturalLanguageQuery, searchState.overallSummary, searchState.articles, toast]);

  const handleExportToJson = React.useCallback(async () => {
    if (!searchState.overallSummary && searchState.articles.length === 0) {
      toast({
        title: "No data to export",
        description: "Please perform a search and generate summaries first.",
        variant: "destructive",
      });
      return;
    }

    const exportData = {
      naturalLanguageQuery: searchState.naturalLanguageQuery,
      translatedQuery: searchState.translatedQuery,
      googleScholarSearchLink: searchState.googleScholarSearchLink,
      overallSummary: searchState.overallSummary,
      factsForKids: searchState.factsForKidsContent,
      articles: searchState.articles.map(a => ({ title: a.title, link: a.link, summary: a.summary })),
      relations: searchState.articleRelations,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const dateSuffix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    link.download = `scholar_chat_export_${searchState.naturalLanguageQuery?.substring(0,20).replace(/\s/g, '_') || 'data'}_${dateSuffix}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exported to JSON",
      description: "Results have been downloaded as a JSON file.",
    });
  }, [searchState, toast]);

  const handleExportToGoogleSheets = React.useCallback(async () => {
    if (!currentUser) {
        toast({
            title: "Sign In Required",
            description: "Please sign in to export to Google Sheets.",
            variant: "destructive",
        });
        return;
    }
    if (!isSheetsAuthorized) {
        toast({
            title: "Authorization Required",
            description: "Please authorize Google Sheets access first via the profile section.",
            variant: "destructive"
        });
        return;
    }

    if (!searchState.overallSummary && searchState.articles.length === 0) {
        toast({
            title: "No Data to Export",
            description: "Please generate summaries or have articles before exporting.",
            variant: "destructive",
        });
        return;
    }

    toast({
        title: "Starting Google Sheets Export",
        description: "Initiating the export process...",
    });

    try {
        const idToken = await currentUser.getIdToken();
        const dataToExport = {
            overallSummary: searchState.overallSummary || "Not generated.",
            articles: searchState.articles.map(a => ({
                title: a.title,
                link: a.link,
                summary: a.summary || "Not available."
            })),
            query: searchState.naturalLanguageQuery || "N/A",
        };

        const response = await fetch('/api/export-to-sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(dataToExport),
        });

        const result = await response.json();

        if (result.success) {
            toast({
                title: "Export Successful",
                description: `Data saved to Google Sheets! ${result.sheetUrl ? `View it here: ${result.sheetUrl}` : ''}`
            });
        } else {
            toast({
                title: "Export Failed",
                description: result.error || "An error occurred while exporting to Google Sheets.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Error exporting to Google Sheets in page.tsx:", error);
        toast({
            title: "Export Failed",
            description: "An unexpected client-side error occurred.",
            variant: "destructive"
        });
    }
  }, [currentUser, isSheetsAuthorized, searchState.overallSummary, searchState.articles, searchState.naturalLanguageQuery, toast]);


  const showSummarizeButton =
    searchState.searchPerformed &&
    !searchState.isLoading &&
    searchState.articles.length > 0 &&
    !searchState.isSummarizingIndividual &&
    !searchState.isGeneratingOverallSummary &&
    !searchState.overallSummary &&
    !searchState.error;

  const relatedTopicsLink = searchState.naturalLanguageQuery
    ? `/?q=${encodeURIComponent(searchState.naturalLanguageQuery + " related topics")}`
    : "#";

  const allArticlesHaveSummaries = searchState.articles.length > 0 && searchState.articles.every(a => a.summary && a.summary !== "Summary not available.");

  const queryFromUrl = searchParams.get('q');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <ScholarChatLogo className="h-8 md:h-10 w-auto" />
            <h1 className="text-xl md:text-2xl font-semibold text-primary hidden sm:block">
              Scholar Chat
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {isAuthLoading ? (
              <LoadingSpinner size={24} />
            ) : currentUser ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Avatar className="cursor-pointer">
                      {currentUser.photoURL ? (
                          <img src={currentUser.photoURL} alt={currentUser.displayName || 'User Avatar'} className="rounded-full h-full w-full object-cover" />
                      ) : (currentUser.displayName || currentUser.email) ? (
                          <AvatarFallback>{currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase()}</AvatarFallback>
                      ): (
                        <AvatarFallback>U</AvatarFallback>
                      )}
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 mr-4">
                     <div className="flex flex-col gap-3">
                        <p className="text-sm font-medium text-foreground text-center">
                            {currentUser.displayName || currentUser.email}
                        </p>
                        {!isSheetsAuthorized && (
                            <Button onClick={handleAuthorizeSheets} variant="outline" size="sm" className="w-full">
                                <SheetIcon className="mr-2 h-4 w-4" /> Authorize Google Sheets
                            </Button>
                        )}
                        {isSheetsAuthorized && (
                            <div className="text-xs text-green-600 flex items-center justify-center">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Sheets Authorized
                            </div>
                        )}
                        {!isNotebookLMAuthorized && (
                            <Button onClick={handleAuthorizeNotebookLM} variant="outline" size="sm" className="w-full">
                                <BookMarked className="mr-2 h-4 w-4" /> Authorize NotebookLM
                            </Button>
                        )}
                        {isNotebookLMAuthorized && (
                             <div className="text-xs text-green-600 flex items-center justify-center">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> NotebookLM Authorized
                            </div>
                        )}
                        <Button onClick={() => signOut(auth)} variant="outline" size="sm" className="w-full">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                     </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <div id="google-sign-in-button-div" className="flex items-center">
                {/* Google Sign-In button will render here by google-identity-services.ts */}
                {/* Fallback button if GIS fails to render */}
                <noscript>
                    <Button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} variant="outline" size="sm">
                        <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
                    </Button>
                </noscript>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section aria-labelledby="search-section-title" className="mb-12 p-6 md:p-8 bg-card rounded-xl shadow-lg">
           <h2 id="search-section-title" className="text-2xl md:text-3xl font-bold text-primary mb-2 text-center">
            Scholar Chat
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            What are you interested in learning about? Just ask. I will provide you the links to the papers and then I can summarize them if you want.
          </p>
          <SearchForm
            initialQuery={queryFromUrl}
            onSearchStart={handleSearchStart}
            onSearchResult={handleSearchResult}
          />
        </section>

        {searchState.isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size={48} text="Searching for articles..." />
          </div>
        )}

        {!searchState.isLoading && searchState.searchPerformed && (
          <section aria-labelledby="results-section-title">
            {searchState.error && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{searchState.error}</AlertDescription>
              </Alert>
            )}

            {searchState.translatedQuery && searchState.articles.length > 0 && !searchState.error && (
              <>
                <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                  <h2 id="results-section-title" className="text-xl md:text-2xl font-semibold text-foreground mb-2">
                    Search Results
                  </h2>
                  <p className="text-sm text-muted-foreground mb-1">
                    Original query: <strong className="text-primary">{searchState.naturalLanguageQuery}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Showing results for:{" "}
                    <strong className="text-primary">{searchState.translatedQuery}</strong>
                  </p>
                  {searchState.googleScholarSearchLink && (
                    <Button asChild variant="link" className="px-0 h-auto py-0 text-accent">
                      <a
                        href={searchState.googleScholarSearchLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View all results on Google Scholar
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                  {searchState.articles.map((article, index) => (
                    <ArticleCard key={index} article={article} />
                  ))}
                </div>
              </>
            )}

            {searchState.articles.length === 0 && !searchState.error && searchState.searchPerformed && !searchState.isLoading && (
                 <Card className="my-8 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl text-primary">No Articles Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        Your search for "<strong className="text-primary">{searchState.naturalLanguageQuery}</strong>" (translated to "<strong className="text-primary">{searchState.translatedQuery}</strong>") did not return any articles. Try refining your search terms.
                        </p>
                    </CardContent>
                 </Card>
            )}


                {showSummarizeButton && (
                  <div className="my-6 text-center">
                    <Button onClick={handleSummarizeAndSynthesize} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Summarize & Synthesize {searchState.articles.length} Results
                    </Button>
                  </div>
                )}

                {(searchState.isSummarizingIndividual || searchState.isGeneratingOverallSummary) && (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner
                      size={48}
                      text={searchState.isSummarizingIndividual ? "Summarizing individual articles..." : "Generating overall summary..."}
                    />
                  </div>
                )}

                {searchState.individualSummarizationError && !searchState.isSummarizingIndividual && (
                  <Alert variant="destructive" className="my-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Individual Summarization Error</AlertTitle>
                    <AlertDescription>{searchState.individualSummarizationError}</AlertDescription>
                  </Alert>
                )}

                {searchState.overallSummaryError && !searchState.isGeneratingOverallSummary && (
                  <Alert variant="destructive" className="my-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Overall Summary Error</AlertTitle>
                    <AlertDescription>{searchState.overallSummaryError}</AlertDescription>
                  </Alert>
                )}

                {searchState.overallSummary && !searchState.isGeneratingOverallSummary && !searchState.overallSummaryError && (
                  <>
                    <Card className="my-8 shadow-lg bg-secondary/30">
                      <CardHeader>
                        <CardTitle className="text-xl md:text-2xl text-primary flex items-center gap-2">
                          <Library className="h-6 w-6 text-accent" />
                          Overall Synthesis
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          A synthesized summary of the key findings from the summarized articles.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{searchState.overallSummary}</p>
                      </CardContent>
                    </Card>

                    <div className="my-6 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
                      <Button asChild variant="outline" disabled={!searchState.naturalLanguageQuery}>
                        <a href={relatedTopicsLink} target="_self" rel="noopener noreferrer">
                          <BookCopy className="mr-2 h-5 w-5" />
                          Related Topics
                        </a>
                      </Button>
                      <Button
                        onClick={handleGenerateFactsForKids}
                        disabled={searchState.isGeneratingFactsForKids || !searchState.overallSummary}
                        variant="outline"
                      >
                        {searchState.isGeneratingFactsForKids ? (
                          <LoadingSpinner size={20} className="mr-2" />
                        ) : (
                          <Lightbulb className="mr-2 h-5 w-5" />
                        )}
                        Facts for Kids
                      </Button>
                      <Button
                        onClick={handleGenerateArticleRelations}
                        disabled={searchState.isGeneratingRelations || !allArticlesHaveSummaries || !searchState.translatedQuery}
                        variant="outline"
                      >
                        {searchState.isGeneratingRelations ? (
                            <LoadingSpinner size={20} className="mr-2" />
                        ) : (
                            <Share2 className="mr-2 h-5 w-5" />
                        )}
                        Visualize Relationships
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            disabled={!searchState.overallSummary && searchState.articles.length === 0}
                            variant="outline"
                          >
                            <Share2 className="mr-2 h-5 w-5" />
                            Export Results
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <div className="grid gap-1">
                            <Button onClick={handleExportToJson} variant="ghost" className="w-full justify-start">
                                <FileJson className="mr-2 h-4 w-4" /> Export to JSON
                            </Button>
                            <Button
                                onClick={handleExportToGoogleSheets}
                                disabled={!currentUser || !isSheetsAuthorized || (!searchState.overallSummary && searchState.articles.length === 0) }
                                variant="ghost" className="w-full justify-start"
                                >
                                <SheetIcon className="mr-2 h-4 w-4" /> Export to Google Sheets
                            </Button>
                            <Button
                                onClick={handleExportToNotebookLM}
                                disabled={(!searchState.overallSummary && searchState.articles.length === 0) || (currentUser && !isNotebookLMAuthorized)}
                                variant="ghost" className="w-full justify-start"
                                >
                                <BookMarked className="mr-2 h-4 w-4" /> Export to NotebookLM
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {searchState.isGeneratingFactsForKids && (
                      <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size={48} text="Generating facts for kids..." />
                      </div>
                    )}
                    {searchState.factsForKidsError && !searchState.isGeneratingFactsForKids && (
                      <Alert variant="destructive" className="my-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Facts for Kids Error</AlertTitle>
                        <AlertDescription>{searchState.factsForKidsError}</AlertDescription>
                      </Alert>
                    )}
                    {searchState.factsForKidsContent && !searchState.isGeneratingFactsForKids && !searchState.factsForKidsError && (
                      <Card className="my-8 shadow-md bg-primary/10 border-primary/30">
                        <CardHeader>
                          <CardTitle className="text-xl md:text-2xl text-primary flex items-center gap-2">
                            <Lightbulb className="h-6 w-6 text-accent" />
                            Facts for Kids
                          </CardTitle>
                          <CardDescription className="text-sm text-primary/80">
                            Simplified explanations for younger learners.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-foreground whitespace-pre-wrap">{searchState.factsForKidsContent}</p>
                        </CardContent>
                      </Card>
                     )}

                    {searchState.isGeneratingRelations && (
                        <div className="flex justify-center items-center py-12">
                            <LoadingSpinner size={48} text="Generating article relationships..." />
                        </div>
                    )}
                    {searchState.articleRelationsError && !searchState.isGeneratingRelations && (
                        <Alert variant="destructive" className="my-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Article Relationships Error</AlertTitle>
                            <AlertDescription>{searchState.articleRelationsError}</AlertDescription>
                        </Alert>
                    )}
                    {searchState.articleRelations && searchState.articleRelations.length > 0 && !searchState.isGeneratingRelations && !searchState.articleRelationsError && (
                        <ArticleRelationshipVisual relations={searchState.articleRelations} articles={searchState.articles} />
                    )}

                     </>
                    )
                    }
          </section>
        )}
         {!searchState.searchPerformed && !searchState.isLoading && (
          <section className="text-center py-12">
             <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                        <Sparkles className="h-7 w-7 text-accent"/>
                        Welcome to Scholar Chat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Enter a natural language query above to search for academic papers.
                        We'll translate your query and find relevant (mock) articles. Then you can choose to summarize and synthesize them.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Alternatively, you can open a new chat with a pre-filled query using a URL like: <code className="bg-secondary/50 px-1 py-0.5 rounded text-accent">/?q=your%20query</code>
                    </p>
                </CardContent>
             </Card>
          </section>
        )}
      </main>
      <footer className="py-6 border-t bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Scholar Chat. For demonstration purposes.
        </div>
      </footer>
    </div>
  );
}
