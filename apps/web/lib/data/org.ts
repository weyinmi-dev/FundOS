export interface Org {
  name: string;
  tag: string;
  mission: string;
  stage: string;
  sector: string;
  hq: string;
}

export const ORG: Org = {
  name: 'Verdantia',
  tag: 'Climate-tech · Soil carbon',
  mission:
    'Turning agricultural waste into permanent soil carbon and healthier farmland for smallholder farmers across East Africa.',
  stage: 'Series A',
  sector: 'Climate / AgTech',
  hq: 'Nairobi + Wageningen',
};

export async function getOrg(): Promise<Org> {
  return ORG;
}
