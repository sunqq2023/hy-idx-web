import TopBar from "@/components/TopBar";
import {
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress,
} from "@/constants";
import config from "@/proviers/config";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { readContract } from "@wagmi/core";
import { useWalletChangeRedirect } from "@/hooks/useWalletChangeRedirect";
import { useBlacklist } from "@/hooks/useBlacklist";

const RootLayout = () => {
  const { isConnected, address, isBlacklisted } = useBlacklist();
  const [adminAddress, setAdminAddress] = useState<null | string>(null);
  const [platformWalletAddress, setPlatformWalletAddress] = useState<
    null | string
  >(null);
  const [isSalePerson, setIsSalePerson] = useState<null | boolean>(null);

  const getIsSadmin = async () => {
    try {
      const res = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "sadmin",
      });
      setAdminAddress(res as string);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getIsSadmin();
  }, []);
  const effectiveIsConnected = isConnected && !isBlacklisted;

  const isAdmin = useMemo(() => {
    if (effectiveIsConnected) {
      return address === adminAddress;
    }
    return false;
  }, [address, effectiveIsConnected, adminAddress]);

  const isPlatformWalletRole = useMemo(() => {
    if (effectiveIsConnected) {
      return address === platformWalletAddress;
    }
    return false;
  }, [address, effectiveIsConnected, platformWalletAddress]);

  const [showTopBar, setShowTopBar] = useState(false);

  const getIsPlatformWalletRole = useCallback(async () => {
    try {
      const result = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "platformWallet",
        args: [],
      });

      setPlatformWalletAddress(result as string);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    getIsPlatformWalletRole();
  }, [getIsPlatformWalletRole]);

  // 判断是否销售账号
  const getIsSalePerson = useCallback(async () => {
    try {
      const result = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "isMotherMachineDistributor",
        args: [address],
      });
      setIsSalePerson(result as boolean);
    } catch (error) {
      console.log(error);
    }
  }, [address]);

  useEffect(() => {
    getIsSalePerson();
  }, [getIsSalePerson]);

  useEffect(() => {
    if (effectiveIsConnected) {
      if (
        adminAddress !== null &&
        platformWalletAddress !== null &&
        isSalePerson !== null
      ) {
        setShowTopBar(isAdmin || isPlatformWalletRole || isSalePerson);
      }
    } else {
      setShowTopBar(false);
    }
  }, [
    effectiveIsConnected,
    isAdmin,
    adminAddress,
    isPlatformWalletRole,
    platformWalletAddress,
    isSalePerson,
  ]);

  const navigate = useNavigate();
  const location = useLocation();

  // 全局黑名单/未连接拦截：黑名单地址或未有效连接时，除了首页以外全部跳回首页
  useEffect(() => {
    if (!effectiveIsConnected && location.pathname !== "/") {
      navigate("/");
    }
  }, [effectiveIsConnected, location.pathname, navigate]);

  useWalletChangeRedirect();
  return (
    <>
      <main
        className={`flex w-full flex-col h-screen`}
        //    +
        //   `${pageSetting.navBar?.sticky ? 'h-auto' : 'h-screen'
      >
        {showTopBar && <TopBar />}
        {/* <TopBar /> */}
        <Outlet />
      </main>
    </>
  );
};

export default RootLayout;
