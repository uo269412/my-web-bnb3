import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import detectEthereumProvider from "@metamask/detect-provider";
import {Contract, ethers} from "ethers";
import { useState, useEffect, useRef } from 'react';
import realStateContractManifest from "./contracts/RealStateContract.json";
import realStateContractCitiesManifest from "./contracts/RealStateContractCities.json";

function App(){
  const realState = useRef(null);
  const realStateCities = useRef(null); 
  const [realStateArray, setRealStateArray] = useState([])
  const [ethUsdPrice, setEthUsdPrice] = useState(0);
  let [newAuthorizedAddress, setNewAuthorizedAddress] = useState("");
  let [globalHistoricalData, setGlobalHistoricalData] = useState([]);
  const [isAdministrator, setIsAdministrator] = useState(false); 

    useEffect( () => {
        initContracts();
    }, [])

    let initContracts = async () => {
        await getBlockchain();
        setIsAdministrator(await realStateCities.current.isAdministrator());
    }
  
    let onSubmitAddAuthorizedAddress = async (e) => {
      e.preventDefault();
  
      const tx = await realStateCities.current.addAuthorizedAddress(newAuthorizedAddress);
      await tx.wait();
  
      setNewAuthorizedAddress("");
    };
  

    let getBlockchain = async () => {
        let provider = await detectEthereumProvider();
        if(provider) {
            await provider.request({ method: 'eth_requestAccounts' });
            const networkId = await provider.request({ method: 'net_version' })

            provider = new ethers.providers.Web3Provider(provider);
            const signer = provider.getSigner();

            realState.current = new Contract(
              realStateContractManifest.networks[networkId].address,
              realStateContractManifest.abi,
              signer
          );

          realStateCities.current = new Contract(
            realStateContractCitiesManifest.networks[networkId].address,
            realStateContractCitiesManifest.abi,
            signer
        );
        }
        return null;
    }

    let onSubmitAddRealState = async (e) => {
      e.preventDefault();
    
      const city = e.target.elements[0].value;
      const street = e.target.elements[1].value;
      const number = parseInt(e.target.elements[2].value);
      const meters = parseInt(e.target.elements[3].value);
      const registration = parseInt(e.target.elements[4].value);
      const owner = e.target.elements[5].value;
      const price = parseInt(e.target.elements[6].value); // Nuevo campo para el precio

      const gas = 40000000;
    
      const tx = await realStateCities.current.addRealState({
        city,
        street,
        number,
        meters,
        registration,
        owner,
        price // Incluir el precio en la estructura
      }, {gasLimit: gas});
    
      await tx.wait();
      setRealStateArray([]);
    };
    
  
  let clickOnDeleteRealState = async (registration) => {

    const tx =  await realState.current.deleteRealStateByRegistration(registration);
    await tx.wait();
    setRealStateArray([])   
}

  let onSubmitSearchRealState = async (e) => {
    e.preventDefault();

    let city = e.target.elements[0].value;

    let newProperties = await realStateCities.current.getRealStateByCity(city);
    setRealStateArray(newProperties)
}

let onSubmitSearchGlobalHistoricalData = async (e) => {
  e.preventDefault();

  let historicalData = await realStateCities.current.getGlobalHistoricalData();
  setGlobalHistoricalData(historicalData);
};

const getEthUsdPrice = async () => {
  const price = await realStateCities.current.getEthUsdPrice();
  setEthUsdPrice(price);
};

const handleGetPriceClick = async () => {
  await getEthUsdPrice();
};
    return (
        <div>
            <h1>RealState</h1>
            <h2>ETH/USD Price: {ethUsdPrice} USD</h2>
            <button onClick={handleGetPriceClick}>Get ETH/USD Price</button>
            <h2>Global Historical Data</h2>
              <form onSubmit={(e) => onSubmitSearchGlobalHistoricalData(e)}>
                <button type="submit">Search Global Historical Data</button>
              </form>
              {globalHistoricalData.length > 0 && (
                <div>
                  <ul>
                    {globalHistoricalData.map((data, index) => (
                      <li key={index}>
                        Requester's address: {data.requester} - Request Date: {new Date(data.timestamp * 1000).toLocaleString()} - Information - 
                        {data.city}, {data.street}, {ethers.BigNumber.from(data.number).toNumber()}, {ethers.BigNumber.from(data.meters).toNumber()}, {ethers.BigNumber.from(data.registration).toNumber()}, {data.owner}, {isAdministrator ? ethers.BigNumber.from(data.price).toNumber() : 0} 
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            <h2>Add New Address</h2>
            <form onSubmit={(e) => onSubmitAddAuthorizedAddress(e)}>
              <input
                type="text"
                placeholder="new address"
                value={newAuthorizedAddress}
                onChange={(e) => setNewAuthorizedAddress(e.target.value)}
              />
              <button type="submit">Add</button>
            </form>
            <h2>Add RealState</h2>
            <form onSubmit= { (e) => onSubmitAddRealState(e) } >
                <input type="text" placeholder="city"/>
                <input type="text" placeholder="street"/>
                <input type="number" placeholder="number"/>
                <input type="number" placeholder="meters"/>
                <input type="number" placeholder="registration"/>
                <input type="text" placeholder="owner name"/>
                <input type="number" placeholder="price" />
                <button type="submit">Add</button>
            </form>
            <h2>Search RealState</h2>
            <form onSubmit= { (e) => onSubmitSearchRealState(e) } >
                <input type="text" placeholder="city"/>
                <button type="submit">Search</button>
            </form>
            { realStateArray.map( (r) =>
            (<p> 
                <button onClick={ () => { clickOnDeleteRealState(r.registration) } }>Delete</button>
                {r.city} - 
                {r.street} - 
                {ethers.BigNumber.from(r.number).toNumber()} -
                {ethers.BigNumber.from(r.meters).toNumber()} -
                {ethers.BigNumber.from(r.registration).toNumber()} -
                {r.owner} - Price:
                {isAdministrator ? ethers.BigNumber.from(r.price).toNumber() : 0} 
            </p>)
        ) }
        </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);