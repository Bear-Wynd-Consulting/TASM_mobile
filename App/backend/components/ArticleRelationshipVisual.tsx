import type { Article, ArticleRelationItem } from "@/app/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tags, FileText, Search } from "lucide-react";

interface ArticleRelationshipVisualProps {
  relations: ArticleRelationItem[];
  articles: Article[]; // Full list of articles to find links
}

export function ArticleRelationshipVisual({ relations, articles }: ArticleRelationshipVisualProps) {
  if (!relations || relations.length === 0) {
    return null; 
  }

  const findArticleLink = (title: string): string | undefined => {
    const article = articles.find(a => a.title === title);
    return article?.link;
  };

  return (
    <div className="my-8">
      <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4 flex items-center gap-2">
        <Tags className="h-6 w-6 text-accent" />
        Article Themes & Connections
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relations.map((relation, index) => (
          <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-200 bg-card flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Tags className="h-5 w-5 text-accent flex-shrink-0" /> 
                  {relation.theme}
                </CardTitle>
                <Button asChild variant="outline" size="sm" className="ml-2 flex-shrink-0">
                  <a 
                    href={`/?q=${encodeURIComponent(relation.theme)}`} // Updated href to open in current app
                    target="_self" // Ensure it opens in the current tab
                    rel="noopener noreferrer" // Keep for security, though _self makes it less critical
                    aria-label={`Search deeper into ${relation.theme}`}
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search Deeper</span>
                  </a>
                </Button>
              </div>
              <CardDescription className="text-xs text-muted-foreground pt-1">
                {relation.relatedArticleTitles.length} related article(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {relation.relatedArticleTitles.length > 0 ? (
                <ul className="space-y-2">
                  {relation.relatedArticleTitles.map((title, titleIndex) => {
                    const link = findArticleLink(title);
                    return (
                      <li key={titleIndex} className="text-sm text-foreground flex items-start">
                        <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-accent transition-colors"
                          >
                            {title} <ExternalLink className="inline-block h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          <span>{title}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific articles strongly matched this theme.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

