import AsyncStorage from "@react-native-async-storage/async-storage";

const read = async <T,>(key: string, fallback: T): Promise<T> => {
  const value = await AsyncStorage.getItem(key);
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
};

const write = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const storage = {
  getUserId: () => read<number>("userId", 0),
  setUserId: (value: number) => write("userId", value),
  getToken: () => read<string>("token", ""),
  setToken: (value: string) => write("token", value),
  getAccountType: () => read<number>("accountType", 0),
  setAccountType: (value: number) => write("accountType", value),
  getPhoneNumber: () => read<string>("phoneNumber", ""),
  setPhoneNumber: (value: string) => write("phoneNumber", value),
  getInfoName: () => read<string>("getInfoName", ""),
  setInfoName: (value: string) => write("getInfoName", value),
  getInfoEmail: () => read<string>("getInfoEmail", ""),
  setInfoEmail: (value: string) => write("getInfoEmail", value),
  getInfoNumber: () => read<string>("getInfoNumber", ""),
  setInfoNumber: (value: string) => write("getInfoNumber", value),
  getInfoAddress: () => read<string>("getInfoAddressed", ""),
  setInfoAddress: (value: string) => write("getInfoAddressed", value),
  getInfoProfile: () => read<string>("getInfoProfile", ""),
  setInfoProfile: (value: string) => write("getInfoProfile", value),
  getInfoGender: () => read<string>("getInfoGender", ""),
  setInfoGender: (value: string) => write("getInfoGender", value),
  getSubscribeToken: () => read<string>("subscribeToken", ""),
  setSubscribeToken: (value: string) => write("subscribeToken", value),
  getAdminToken: () => read<string>("adminToken", ""),
  setAdminToken: (value: string) => write("adminToken", value),
  getWelcomeNotificationShown: () => read<boolean>("welcomeNotificationShown", false),
  setWelcomeNotificationShown: (value: boolean) => write("welcomeNotificationShown", value),
  clearAll: () => AsyncStorage.clear()
};
