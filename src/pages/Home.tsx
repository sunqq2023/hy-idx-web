import { Divider } from "antd-mobile";
import { idxSvg } from "@/assets";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomConnectButton from "@/components/ConnectButton";
import { useMimirList } from "@/hooks/useMimirList";
import { readContract } from "@wagmi/core";
import config from "@/proviers/config";
import {
  MiningMachineSystemStorageABI,
  MiningMachineSystemStorageAddress,
} from "@/constants";
import orderStore from "@/stores/orderStore";

const Home = () => {
  const navigate = useNavigate();
  const [adminAddress, setAdminAddress] = useState<null | string>(null);
  const [motherMachineDistributorAddress, setMotherMachineDistributorAddress] =
    useState<null | string>(null);
  const [isSalePerson, setIsSalePerson] = useState<null | boolean>(null);

  const { isConnected, address, isMimir } = useMimirList();

  const effectiveIsConnected = isConnected && !isMimir;

  // 判断是否铸造账号
  const getIsMotherMachineDistributor = useCallback(async () => {
    try {
      const result = await readContract(config, {
        address: MiningMachineSystemStorageAddress,
        abi: MiningMachineSystemStorageABI,
        functionName: "platformWallet",
        args: [],
      });

      setMotherMachineDistributorAddress(result as string);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    getIsMotherMachineDistributor();
  }, [getIsMotherMachineDistributor]);

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

  const isAdmin = useMemo(() => {
    if (effectiveIsConnected) {
      return address === adminAddress;
    }
  }, [address, effectiveIsConnected, adminAddress]);

  const isMotherMachineDistributor = useMemo(() => {
    if (effectiveIsConnected) {
      return address === motherMachineDistributorAddress;
    }
    return false;
  }, [address, effectiveIsConnected, motherMachineDistributorAddress]);

  useEffect(() => {
    if (effectiveIsConnected) {
      if (adminAddress !== null && isAdmin) {
        navigate("/setting");
      } else if (
        motherMachineDistributorAddress !== null &&
        isMotherMachineDistributor
      ) {
        navigate("/make-mmm");
      } else if (isSalePerson !== null && isSalePerson) {
        navigate("/sale-person");
      } else if (
        adminAddress !== null &&
        !isAdmin &&
        motherMachineDistributorAddress !== null &&
        !isMotherMachineDistributor &&
        isSalePerson !== null &&
        !isSalePerson
      ) {
        navigate("/user");
      }
    }
  }, [
    effectiveIsConnected,
    navigate,
    isAdmin,
    isMotherMachineDistributor,
    motherMachineDistributorAddress,
    adminAddress,
    isSalePerson,
  ]);

  useEffect(() => {
    if (!effectiveIsConnected) {
      orderStore.clearData();
    }
  }, [effectiveIsConnected]);

  return (
    <div className="px-[1.3125rem]">
      <div className="bg-white rounded-3xl p-4 mt-10 flex flex-col items-center ">
        <div className="mt-8 flex justify-center">
          <img src={idxSvg} alt="" />
        </div>

        <Divider className="mt-4  w-full h-0.5 bg-[#ececee]" />

        <CustomConnectButton />
      </div>
    </div>
  );
};

export default Home;
