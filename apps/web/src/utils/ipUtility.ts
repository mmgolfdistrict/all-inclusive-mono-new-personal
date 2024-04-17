import os from "os";

export type NICDetails = {
  NICName: string;
  Family: string;
  IPAddress: string;
  MACAddress: string;
};

export const EMPTY_NIC_INFO: NICDetails = {
  NICName: "",
  Family: "",
  IPAddress: "",
  MACAddress: "",
};

export function getNICDetails(): NICDetails[] {
  const nicInfos: NICDetails[] = [];
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    const nicInfo = interfaces[key];

    if (nicInfo) {
      nicInfo.forEach((info) => {
        nicInfos.push({
          NICName: key,
          Family: info.family,
          IPAddress: info.address,
          MACAddress: info.mac,
        });
      });
    }
  }

  return nicInfos;
}
