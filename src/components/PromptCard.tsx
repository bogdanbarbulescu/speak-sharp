import { cn } from '@/lib/utils';
import { Difficulty } from '@/types/session';
import { Badge } from '@/components/ui/badge';

interface PromptCardProps {
  text: string;
  difficulty: Difficulty;
  className?: string;
}

const difficultyConfig: Record<Difficulty, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  easy: { label: '🟢 Easy', variant: 'secondary' },
  abstract: { label: '🟡 Abstract', variant: 'default' },
  controversial: { label: '🔴 Controversial', variant: 'destructive' },
};

export function PromptCard({ text, difficulty, className }: PromptCardProps) {
  const config = difficultyConfig[difficulty];

  return (
    <div
      className={cn(
        'w-full max-w-2xl p-6 sm:p-8 rounded-2xl',
        'bg-card border border-border shadow-lg',
        'flex flex-col items-center gap-4',
        className
      )}
    >
      <Badge variant={config.variant} className="text-sm px-3 py-1">
        {config.label}
      </Badge>
      
      <p className="text-xl sm:text-2xl md:text-3xl font-medium text-center text-foreground leading-relaxed">
        {text}
      </p>
    </div>
  );
}
