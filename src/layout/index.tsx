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
import { useMimirList } from "@/hooks/useMimirList";

const RootLayout = () => {
  const { isConnected, address, isMimir } = useMimirList();
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
  const effectiveIsConnected = isConnected && !isMimir;

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
    if (!address) return;
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

  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === "true";
  const isSettingsPage = location.pathname === "/setting";

  // 全局 mimir/未连接拦截：mimir地址或未有效连接时，除了首页以外全部跳回首页
  useEffect(() => {
    if (!effectiveIsConnected && location.pathname !== "/") {
      navigate("/");
    }
  }, [effectiveIsConnected, location.pathname, navigate]);

  useWalletChangeRedirect();
  const shouldShowMaintenance = isMaintenance && !isSettingsPage;

  return (
    <>
      <main className={`flex w-full flex-col h-screen`}>
        {showTopBar && <TopBar />}
        {shouldShowMaintenance ? (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              backgroundColor: "#030712",
              color: "#e5e7eb",
              textAlign: "center",
              padding: "24px",
            }}
          >
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>
              系统维护中
            </h1>
            <p
              style={{
                fontSize: "14px",
                maxWidth: "480px",
                lineHeight: 1.6,
              }}
            >
              当前系统正在进行合约升级与数据迁移，期间暂不提供操作服务。请稍后再试或关注官方公告获取最新进展。
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  );
};

export default RootLayout;
