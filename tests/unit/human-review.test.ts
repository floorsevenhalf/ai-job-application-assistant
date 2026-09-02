import { describe, expect, it } from 'vitest';
import type { MatchResult } from '../../extension/core/matcher/types';
import { defaultFieldSelections, hasCandidateConflict, isReviewable, suggestedProfilePath } from '../../extension/popup/human-review';
import { resolveProfileValue } from '../../extension/profile/resolver';
import type { UserProfile } from '../../extension/profile/schema';

const profile: UserProfile = { schemaVersion: 2, id: 'p', profileName: 'p', basic: { fullName: '张三', gender: '', phone: '', email: '', birthDate: '', city: '上海', region: '' }, educations: [], internships: [], projects: [], languages: [], familyMembers: [], jobPreferences: { directions: [], preferredCities: ['上海'] }, metadata: { createdAt: '', updatedAt: '' } };
function result(overrides: Partial<MatchResult> = {}): MatchResult { return { fieldId: 'name', status: 'ambiguous', profilePath: 'basic.fullName', confidence: .72, evidence: [], candidatePaths: [{ profilePath: 'basic.fullName', confidence: .72 }, { profilePath: 'educations.primary.school', confidence: .31 }], ...overrides }; }

describe('Human Review', () => {
  it('makes ambiguous 0.72 basic.fullName reviewable and resolves its value', () => { const match=result(); expect(isReviewable(match,profile)).toBe(true); expect(resolveProfileValue(profile,suggestedProfilePath(match)!)).toBe('张三'); });
  it('selects safe reviewable fields at 0.70 or above by default', () => expect(defaultFieldSelections([result()],profile).get('name')?.source).toBe('rule_confirmed'));
  it('does not select reviewable fields below 0.70 by default', () => expect(defaultFieldSelections([result({confidence:.69})],profile).size).toBe(0));
  it('keeps rule matched fields selected with rule_matched source', () => expect(defaultFieldSelections([result({status:'matched',confidence:.9})]).get('name')?.source).toBe('rule_matched'));
  it('does not review confidence below 0.65', () => expect(isReviewable(result({confidence:.64}),profile)).toBe(false));
  it('does not review strong negative vetoes', () => expect(isReviewable(result({evidence:[{source:'label',text:'推荐人姓名',score:-1,kind:'negative',veto:true}]}),profile)).toBe(false));
  it.each(['empty_profile_value','unmatched','excluded'] as const)('does not review %s', status => expect(isReviewable(result({status}),profile)).toBe(false));
  it('does not review an empty profile value', () => expect(isReviewable(result({profilePath:'basic.email',candidatePaths:[{profilePath:'basic.email',confidence:.72}]}),profile)).toBe(false));
  it('warns when top candidates are closer than the matcher margin', () => expect(hasCandidateConflict(result({candidatePaths:[{profilePath:'basic.city',confidence:.73},{profilePath:'jobPreferences.preferredCities',confidence:.70}]}))).toBe(true));
});
