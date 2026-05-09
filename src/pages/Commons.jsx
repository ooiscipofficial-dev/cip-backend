import Navbar from '../components/layout/Navbar';
import { GLOBAL_PADLET } from '../lib/mockData';
import { Globe } from 'lucide-react';

const hasBoard = GLOBAL_PADLET && GLOBAL_PADLET !== "";

export default function Commons({ session }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar session={session} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe size={16} />
          <h1 className="text-lg font-semibold">Commons</h1>
          <span className="text-xs text-muted-foreground">· Cross-council collaboration</span>
        </div>

        {hasBoard ? (
          <iframe
            src={GLOBAL_PADLET}
            className="w-full rounded-2xl border border-border"
            style={{ height: '75vh' }}
            title="Global Padlet Board"
          />
        ) : (
          <div className="border border-dashed border-border rounded-2xl p-12 text-center">
            <Globe size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No Commons board configured</p>
            <p className="text-xs text-muted-foreground">
              Set the <code className="font-mono bg-muted px-1 rounded">GLOBAL_PADLET</code> URL in{' '}
              <code className="font-mono bg-muted px-1 rounded">lib/mockData.js</code> to embed the shared board.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
