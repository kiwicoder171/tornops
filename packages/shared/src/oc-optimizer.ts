import {
  CrimeSkillType,
  CrimeTeamTemplate,
  MemberCrimeProficiency,
  OptimizedCrimeTeam,
  OptimizedSlotAssignment,
} from "./types.js";

export const OC_TEMPLATES: CrimeTeamTemplate[] = [
  {
    crimeTypeId: 1,
    crimeName: "Safehouse Infiltration",
    difficulty: "Medium",
    slots: [
      { slotIndex: 0, slotName: "Lookout & Intel", primarySkill: "burglary", minSkillLevel: 25, recommendedSkillLevel: 45 },
      { slotIndex: 1, slotName: "Security Bypass", primarySkill: "cracking", minSkillLevel: 30, recommendedSkillLevel: 50 },
      { slotIndex: 2, slotName: "Heavy Breacher", primarySkill: "burglary", minSkillLevel: 20, recommendedSkillLevel: 40 },
    ],
  },
  {
    crimeTypeId: 2,
    crimeName: "Offshore Server Raid",
    difficulty: "Hard",
    slots: [
      { slotIndex: 0, slotName: "Social Engineer", primarySkill: "scamming", minSkillLevel: 35, recommendedSkillLevel: 55 },
      { slotIndex: 1, slotName: "System Penetration", primarySkill: "cybercrime", minSkillLevel: 45, recommendedSkillLevel: 70 },
      { slotIndex: 2, slotName: "Network Sniffer", primarySkill: "cybercrime", minSkillLevel: 40, recommendedSkillLevel: 65 },
      { slotIndex: 3, slotName: "Data Extraction", primarySkill: "cracking", minSkillLevel: 35, recommendedSkillLevel: 60 },
    ],
  },
  {
    crimeTypeId: 3,
    crimeName: "Luxury Cargo Hijack",
    difficulty: "Expert",
    slots: [
      { slotIndex: 0, slotName: "Manifest Tamperer", primarySkill: "forgery", minSkillLevel: 40, recommendedSkillLevel: 65 },
      { slotIndex: 1, slotName: "Route Interceptor", primarySkill: "illicitServices", minSkillLevel: 50, recommendedSkillLevel: 75 },
      { slotIndex: 2, slotName: "Lock Expert", primarySkill: "burglary", minSkillLevel: 45, recommendedSkillLevel: 70 },
      { slotIndex: 3, slotName: "Contraband Disposer", primarySkill: "disposal", minSkillLevel: 35, recommendedSkillLevel: 60 },
    ],
  },
];

/**
 * Optimizes team slot assignment for a specific crime template from the available member pool.
 */
export function optimizeCrimeTeam(
  template: CrimeTeamTemplate,
  members: MemberCrimeProficiency[]
): OptimizedCrimeTeam {
  const availableMembers = [...members.filter((m) => m.isAvailable)];
  const assignments: OptimizedSlotAssignment[] = [];

  let totalConfidence = 0;

  for (const slot of template.slots) {
    // Rank candidates by their proficiency in the required skill
    availableMembers.sort((a, b) => {
      const skillA = a.skills[slot.primarySkill] || 0;
      const skillB = b.skills[slot.primarySkill] || 0;
      return skillB - skillA;
    });

    const chosen = availableMembers[0];

    if (chosen) {
      const playerSkill = chosen.skills[slot.primarySkill] || 0;
      // Confidence score based on recommended skill level
      const confidence = Math.min(
        100,
        Math.round((playerSkill / Math.max(1, slot.recommendedSkillLevel)) * 100)
      );

      assignments.push({
        slotIndex: slot.slotIndex,
        slotName: slot.slotName,
        assignedPlayerId: chosen.playerId,
        assignedPlayerName: chosen.playerName,
        playerSkillLevel: playerSkill,
        requiredSkillLevel: slot.minSkillLevel,
        confidenceScore: confidence,
      });

      totalConfidence += confidence;
      // Remove candidate from available pool so they aren't double-assigned
      const index = availableMembers.findIndex((m) => m.playerId === chosen.playerId);
      if (index !== -1) {
        availableMembers.splice(index, 1);
      }
    } else {
      // No available candidate found
      assignments.push({
        slotIndex: slot.slotIndex,
        slotName: slot.slotName,
        assignedPlayerId: 0,
        assignedPlayerName: "Unfilled",
        playerSkillLevel: 0,
        requiredSkillLevel: slot.minSkillLevel,
        confidenceScore: 0,
      });
    }
  }

  const overallSuccessRate =
    template.slots.length > 0 ? Math.round(totalConfidence / template.slots.length) : 0;

  return {
    crimeTypeId: template.crimeTypeId,
    crimeName: template.crimeName,
    overallSuccessRate,
    assignments,
  };
}

/**
 * Detects members who have unaccepted invitations older than threshold hours.
 */
export function findStalledInvites(
  members: MemberCrimeProficiency[],
  maxPendingHours: number = 6
): Array<{ playerId: number; playerName: string; crimeId: number; hoursPending: number }> {
  const now = Math.floor(Date.now() / 1000);
  const stalled: Array<{ playerId: number; playerName: string; crimeId: number; hoursPending: number }> = [];

  for (const member of members) {
    if (member.pendingInviteCrimeId && member.inviteSentTimestamp) {
      const elapsedSeconds = now - member.inviteSentTimestamp;
      const hoursPending = Math.round(elapsedSeconds / 3600);
      if (hoursPending >= maxPendingHours) {
        stalled.push({
          playerId: member.playerId,
          playerName: member.playerName,
          crimeId: member.pendingInviteCrimeId,
          hoursPending,
        });
      }
    }
  }

  return stalled;
}
