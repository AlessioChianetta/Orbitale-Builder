import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface PreviewFrameProps {
  url: string;
  className?: string;
}

const deviceSizes = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' }
};

export function PreviewFrame({ url, className }: PreviewFrameProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [key, setKey] = useState(0);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const currentSize = deviceSizes[device];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Device Selector */}
      <div className="flex items-center gap-2 mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex gap-1">
          <Button
            variant={device === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('desktop')}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            Desktop
          </Button>
          <Button
            variant={device === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('tablet')}
            className="gap-2"
          >
            <Tablet className="h-4 w-4" />
            Tablet
          </Button>
          <Button
            variant={device === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('mobile')}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            Mobile
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSize.width} × {currentSize.height}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RotateCw className="h-4 w-4" />
            Ricarica
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="flex items-center justify-center h-full bg-muted/20 p-4">
            <div
              className={cn(
                "bg-background shadow-2xl transition-all duration-300",
                device === 'desktop' ? 'w-full h-full' : 'rounded-lg overflow-hidden'
              )}
              style={{
                width: device === 'desktop' ? '100%' : currentSize.width,
                height: device === 'desktop' ? '100%' : currentSize.height,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <iframe
                key={key}
                src={url}
                className="w-full h-full border-0"
                title="Site Preview"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
