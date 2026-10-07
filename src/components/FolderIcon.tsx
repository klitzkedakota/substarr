import React from 'react';
import {
  Boxes,
  FlaskConical,
  Compass,
  Gamepad2,
  Cpu,
  Laptop,
  Folder as FolderIconLucide,
  FolderOpen,
  Film,
  Flame,
  Music,
  Code,
  Wrench,
  BookOpen,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react';

interface Props {
  iconName: string;
  className?: string;
  color?: string;
}

export const FolderIcon: React.FC<Props> = ({ iconName, className = 'w-4 h-4', color }) => {
  const iconProps = { className, style: color ? { color } : undefined };

  switch (iconName.toLowerCase()) {
    case 'boxes':
    case 'lego':
      return <Boxes {...iconProps} />;
    case 'flaskconical':
    case 'chemistry':
    case 'science':
      return <FlaskConical {...iconProps} />;
    case 'compass':
    case 'outdoor':
    case 'hunting':
      return <Compass {...iconProps} />;
    case 'gamepad2':
    case 'gaming':
      return <Gamepad2 {...iconProps} />;
    case 'cpu':
    case 'tech':
      return <Cpu {...iconProps} />;
    case 'laptop':
      return <Laptop {...iconProps} />;
    case 'film':
    case 'movies':
      return <Film {...iconProps} />;
    case 'flame':
      return <Flame {...iconProps} />;
    case 'music':
      return <Music {...iconProps} />;
    case 'code':
      return <Code {...iconProps} />;
    case 'wrench':
    case 'diy':
      return <Wrench {...iconProps} />;
    case 'bookopen':
    case 'education':
      return <BookOpen {...iconProps} />;
    case 'zap':
      return <Zap {...iconProps} />;
    case 'layers':
      return <Layers {...iconProps} />;
    default:
      return <FolderIconLucide {...iconProps} />;
  }
};
