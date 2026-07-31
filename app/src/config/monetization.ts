/**
 * Affiliate/sponsored-content configuration.
 *
 * All values below are placeholders. Sign up for a Thai broker's
 * affiliate/referral program, then paste your real referral link here --
 * the sponsored card below stays hidden everywhere in the app until
 * referralUrl is non-empty, so this is safe to ship as-is.
 */
export interface AffiliateBrokerConfig {
  brokerName: string;
  referralUrl: string;
}

export const AFFILIATE_BROKER: AffiliateBrokerConfig = {
  brokerName: "",
  referralUrl: "",
};

export function isAffiliateConfigured(): boolean {
  return AFFILIATE_BROKER.referralUrl.trim().length > 0;
}
