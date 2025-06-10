
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookText } from "lucide-react";
import type { Article } from "@/app/actions";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl leading-tight text-primary flex items-start gap-2">
          <BookText className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {article.summary ? (
          <CardDescription className="text-sm text-muted-foreground line-clamp-4">
            {article.summary}
          </CardDescription>
        ) : (
          <CardDescription className="text-sm text-muted-foreground italic">
            Summary not yet generated. Click "Summarize Results" to generate summaries.
          </CardDescription>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            Read on Google Scholar
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
