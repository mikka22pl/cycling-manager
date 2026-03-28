export type SegmentType = 'flat' | 'climb' | 'descent';

export type Segment = {
  startKm: number;
  endKm: number;
  type: SegmentType;
  gradient: number; // % (positive = uphill, negative = downhill)
  wind?: {
    direction: 'head' | 'tail' | 'cross';
    strength: number; // 0–1
  };
};
