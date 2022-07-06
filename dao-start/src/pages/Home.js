import React, { useEffect, useState } from "react";
import "./pages.css";
import { TabList, Tab, Widget, Tag, Table, Form } from "web3uikit";
import { Link } from "react-router-dom";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";

const Home = () => {
  const [passRate, setPassRate] = useState(0);
  const [totalP, setTotalP] = useState(0);
  const [counted, setCounted] = useState(0);
  const [voters, setVoters] = useState(0);
  const { Moralis, isInitialized } = useMoralis();
  const [proposals, setProposals] = useState();
  const Web3Api = useMoralisWeb3Api();

  async function getStatus(proposalId) {
    const ProposalCounts = Moralis.Object.extend("ProposalCounts");
    const query = new Moralis.Query(ProposalCounts);
    query.equalTo("uid", proposalId);
    const result = await query.first();
    if (result !== undefined) {
      if (result.attributes.passed) {
        return { color: "green", text: "Passed" };
      } else {
        return { color: "red", text: "Rejected" };
      }
    } else {
      return { color: "blue", text: "Ongoing" };
    }
  }

  useEffect(() => {
    if (isInitialized) {
      async function getProposals() {
        const Proposals = Moralis.Object.extend("Proposals");
        const query = new Moralis.Query(Proposals);
        query.descending("uid_decimal");
        const results = await query.find();
        const table = await Promise.all(
          results.map(async (e) => [
            e.attributes.uid,
            e.attributes.description,
            <Link
              to="/proposal"
              state={{
                description: e.attributes.description,
                color: (await getStatus(e.attributes.uid)).color,
                text: (await getStatus(e.attributes.uid)).text,
                id: e.attributes.id,
                proposer: e.attributes.proposer,
              }}
            >
              <Tag
                color={(await getStatus(e.attributes.uid)).color}
                text={(await getStatus(e.attributes.uid)).text}
              />
            </Link>,
          ])
        );
        setProposals(table);
        setTotalP(results.length);
      }

      async function getPassRate() {
        const ProposalCounts = Moralis.Object.extend("ProposalCounts");
        const query = new Moralis.Query(ProposalCounts);
        const results = await query.find();
        let votesUp = 0;

        results.forEach((e) => {
          if (e.attributes.passed) {
            votesUp++;
          }
        });

        setCounted(results.length);
        setPassRate((votesUp / results.length) * 100);
      }

      const fetchTokenIdOwners = async () => {
        const options = {
          address: "0x2953399124f0cbb46d2cbacd8a89cf0599974963",
          token_id:
            "87958762214836331246152245185105057967196013790640886072600689433881360728079",
          chain: "mumbai",
        };
        const tokenIdOwners = await Web3Api.token.getTokenIdOwners(options);
        const addresses = tokenIdOwners.result.map((e) => e.owner_of);
        setVoters(addresses);
      };

      fetchTokenIdOwners();
      getProposals();
      getPassRate();
    }
  }, [isInitialized]);

  return (
    <>
      <div className="content">
        <TabList defaultActiveKeys={1} tabStyle="bulbUnion">
          <Tab tabKey={1} tabName={"DAO"}>
            {proposals && (
              <div className="tabContent">
                Governance Overview
                <div className="widgets">
                  <Widget
                    info={totalP}
                    title="Proposals Created"
                    style={{ width: "200%" }}
                  >
                    <div className="extraWidgetInfo">
                      <div className="extraTitle">Pass Rate</div>
                      <div className="progress">
                        <div
                          className="progressPercentage"
                          style={{ width: `${passRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </Widget>
                  <Widget info={voters.length} title="Eligible Voters" />
                  <Widget info={totalP - counted} title="Ongoing Proposals" />
                </div>
                <div>
                  Recent Proposals
                  <div style={{ marginTop: "30px" }}>
                    <Table
                      columnsConfig="10% 70% 20%"
                      data={proposals}
                      header={[
                        <span>ID</span>,
                        <span>Description</span>,
                        <span>Status</span>,
                      ]}
                      pageSize={5}
                    />
                  </div>
                  <Form
                    buttonConfig={{
                      isLoading: false,
                      isLoadingText: "Submitting Proposal",
                      text: "Submit",
                      theme: "secondary",
                    }}
                    data={[
                      {
                        inputWidth: "100%",
                        name: "New Proposal",
                        type: "textarea",
                        validation: {
                          required: true,
                        },
                        value: "",
                      },
                    ]}
                    onSubmit={(e) => {
                      alert("Proposal Submitted");
                    }}
                    title="Create a New Proposal"
                  />
                </div>
              </div>
            )}
          </Tab>

          <Tab tabKey={2} tabName={"Forum"}></Tab>
          <Tab tabKey={3} tabName={"Docs"}></Tab>
        </TabList>
      </div>
      <div className="voting"></div>
    </>
  );
};

export default Home;
