import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Challenge } from '@/hooks/useChallenges';
import { ChallengeNode } from './ChallengeNode';

const nodeTypes = { challenge: ChallengeNode };

// Noir Detective theme colors
const categoryColors: Record<string, string> = {
  Web: 'hsl(38, 100%, 50%)',      // Amber/Gold
  Pwn: 'hsl(0, 70%, 45%)',        // Crimson
  Crypto: 'hsl(50, 100%, 50%)',   // Yellow/Gold
  Forensics: 'hsl(30, 80%, 50%)', // Orange/Rust
  Other: 'hsl(60, 20%, 70%)',     // Paper
};

interface ChallengeGraphProps {
  challenges: Challenge[];
  onSelectChallenge: (c: Challenge) => void;
  isChallengeUnlocked: (c: Challenge) => boolean;
  isChallengeSolved: (id: string) => boolean;
}

export function ChallengeGraph({ 
  challenges, 
  onSelectChallenge, 
  isChallengeUnlocked, 
  isChallengeSolved 
}: ChallengeGraphProps) {

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Position nodes in a grid/tree layout
    const levelMap = new Map<string, number>();

    // Calculate levels based on dependencies
    const calculateLevel = (challenge: Challenge, visited = new Set<string>()): number => {
      if (visited.has(challenge.id)) return 0;
      visited.add(challenge.id);
      
      if (!challenge.dependencies || challenge.dependencies.length === 0) {
        return 0;
      }
      
      const depLevels = challenge.dependencies.map(depId => {
        const dep = challenges.find(c => c.id === depId);
        return dep ? calculateLevel(dep, visited) + 1 : 0;
      });
      
      return Math.max(...depLevels);
    };

    challenges.forEach(c => {
      levelMap.set(c.id, calculateLevel(c));
    });

    // Group by level
    const levelGroups = new Map<number, Challenge[]>();
    challenges.forEach(c => {
      const level = levelMap.get(c.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(c);
    });

    // Position nodes
    const xSpacing = 280;
    const ySpacing = 180;

    levelGroups.forEach((group, level) => {
      const startX = -(group.length - 1) * xSpacing / 2;
      group.forEach((challenge, index) => {
        const isUnlocked = isChallengeUnlocked(challenge);
        const isSolved = isChallengeSolved(challenge.id);

        nodes.push({
          id: challenge.id,
          type: 'challenge',
          position: { x: startX + index * xSpacing, y: level * ySpacing },
          data: {
            challenge,
            isUnlocked,
            isSolved,
            color: categoryColors[challenge.category] || categoryColors.Other,
            onSelect: () => isUnlocked && onSelectChallenge(challenge),
          },
        });

        // Create CURVED edges for dependencies (smoothstep type)
        challenge.dependencies?.forEach(depId => {
          const depChallenge = challenges.find(c => c.id === depId);
          const isDepSolved = depChallenge ? isChallengeSolved(depId) : false;
          
          edges.push({
            id: `${depId}-${challenge.id}`,
            source: depId,
            target: challenge.id,
            type: 'smoothstep', // CURVED BEZIER LINES
            animated: !isSolved && isUnlocked,
            style: { 
              stroke: isDepSolved 
                ? categoryColors[challenge.category] || 'hsl(38, 100%, 50%)'
                : 'hsl(0, 0%, 25%)',
              strokeWidth: 2,
              opacity: isUnlocked ? 1 : 0.4,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isDepSolved 
                ? categoryColors[challenge.category] || 'hsl(38, 100%, 50%)'
                : 'hsl(0, 0%, 25%)',
            },
          });
        });
      });
    });

    return { nodes, edges };
  }, [challenges, isChallengeUnlocked, isChallengeSolved, onSelectChallenge]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when challenges data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (challenges.length === 0) {
    return (
      <div className="w-full h-[65vh] rounded border border-primary/20 bg-card/30 flex items-center justify-center">
        <p className="text-muted-foreground font-mono">NO CASE FILES AVAILABLE</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[65vh] rounded border border-primary/20 bg-card/30 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="hsl(38, 100%, 50%)" 
          gap={40} 
          size={1}
          style={{ opacity: 0.05 }}
        />
        <Controls className="bg-card border-border" />
      </ReactFlow>
    </div>
  );
}
