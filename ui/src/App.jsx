import { useState, useEffect } from "react";
import * as React from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, ROLES } from "./config";
import { getProvider, getSigner, getContracts, getProposalState } from "./utils/contracts";
import {
  AppBar, Toolbar, IconButton, Typography, Button, Box, Grid, Card,
  CardContent, CardActions, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

function App() {
  const [loginState, setLoginState] = useState("Connect");
  const [userAddress, setUserAddress] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [pDescription, setPDescription] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [delegateAddress, setDelegateAddress] = useState("");
  const [grantRoleAddress, setGrantRoleAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [open, setOpen] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [grantRoleOpen, setGrantRoleOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (userAddress) {
        try {
          await checkAdminRole();
          await getProposals();
        } catch (error) {
          console.error("Error during initialization:", error);
        }
      }
    };
    init();
  }, [userAddress]);

  const checkAdminRole = async () => {
    if (!userAddress) return;
    try {
      const signer = await getSigner();
      const { timeLock } = await getContracts(signer);
      const hasAdminRole = await timeLock.hasRole(ROLES.ADMIN_ROLE, userAddress);
      setIsAdmin(hasAdminRole);
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
    }
  };

  const handleSubmit = async () => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { governor, cert } = await getContracts(signer);

      // Example proposal to issue a certificate
      const paramsArray = [104, "An", "EDP", "A", "25th June"];
      const transferCalldata = cert.interface.encodeFunctionData("issue", paramsArray);

      const proposeTx = await governor.propose(
        [CONTRACT_ADDRESSES.Cert],
        [0],
        [transferCalldata],
        pDescription
      );
      await proposeTx.wait();
      await getProposals();
      setOpen(false);
    } catch (error) {
      console.error("Error proposing transaction:", error);
      alert("Error creating proposal. Make sure you have enough voting power.");
    } finally {
      setLoading(false);
    }
  };

  const getProposals = async () => {
    if (!userAddress) return;
    try {
      const signer = await getSigner();
      const { governor } = await getContracts(signer);
      
      const filter = governor.filters.ProposalCreated();
      const events = await governor.queryFilter(filter);
      
      const proposalDetails = await Promise.all(events.map(async (event) => {
        const state = await governor.state(event.args[0]);
        return {
          id: event.args[0].toString(),
          description: event.args[8],
          state: getProposalState(state)
        };
      }));
      
      setProposals(proposalDetails);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  const connectMetaMask = async () => {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setLoginState("Connected: " + address.slice(0, 6) + "...");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Error connecting to MetaMask. Please make sure it's installed and unlocked.");
    }
  };

  const mintTokens = async () => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { govToken } = await getContracts(signer);
      const tx = await govToken.mint(userAddress, ethers.parseEther(mintAmount));
      await tx.wait();
      alert("Tokens minted successfully!");
      setMintOpen(false);
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Error minting tokens. Make sure you have admin rights.");
    } finally {
      setLoading(false);
    }
  };

  const delegateVotes = async () => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { govToken } = await getContracts(signer);
      const tx = await govToken.delegate(delegateAddress);
      await tx.wait();
      alert("Votes delegated successfully!");
      setDelegateOpen(false);
    } catch (error) {
      console.error("Error delegating votes:", error);
      alert("Error delegating votes. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  const grantRole = async () => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { timeLock } = await getContracts(signer);
      const tx = await timeLock.grantRole(ROLES[selectedRole], grantRoleAddress);
      await tx.wait();
      alert("Role granted successfully!");
      setGrantRoleOpen(false);
    } catch (error) {
      console.error("Error granting role:", error);
      alert("Error granting role. Make sure you have admin rights.");
    } finally {
      setLoading(false);
    }
  };

  const voteOnProposal = async (proposalId, support) => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { governor } = await getContracts(signer);
      const tx = await governor.castVote(proposalId, support);
      await tx.wait();
      await getProposals();
      alert("Vote cast successfully!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Error casting vote. Make sure you have enough voting power.");
    } finally {
      setLoading(false);
    }
  };

  const queueProposal = async (proposalId) => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { governor } = await getContracts(signer);
      const tx = await governor.queue(proposalId);
      await tx.wait();
      await getProposals();
      alert("Proposal queued successfully!");
    } catch (error) {
      console.error("Error queueing proposal:", error);
      alert("Error queueing proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const executeProposal = async (proposalId) => {
    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }
    setLoading(true);
    try {
      const signer = await getSigner();
      const { governor } = await getContracts(signer);
      const tx = await governor.execute(proposalId);
      await tx.wait();
      await getProposals();
      alert("Proposal executed successfully!");
    } catch (error) {
      console.error("Error executing proposal:", error);
      alert("Error executing proposal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              DAO: Certi App
            </Typography>
            <Button color="inherit" onClick={connectMetaMask} disabled={loading}>
              <b>{loginState}</b>
            </Button>
          </Toolbar>
        </AppBar>
      </Box>

      <Box sx={{ m: 2 }}>
        {isAdmin && (
          <>
            <Button variant="contained" onClick={() => setMintOpen(true)} sx={{ mr: 1 }} disabled={loading}>
              Mint Tokens
            </Button>
            <Button variant="contained" onClick={() => setGrantRoleOpen(true)} sx={{ mr: 1 }} disabled={loading}>
              Grant Role
            </Button>
          </>
        )}
        <Button variant="contained" onClick={() => setDelegateOpen(true)} sx={{ mr: 1 }} disabled={loading}>
          Delegate Votes
        </Button>
        <Button variant="contained" onClick={() => setOpen(true)} sx={{ mr: 1 }} disabled={loading}>
          New Proposal
        </Button>
        <Button variant="contained" onClick={getProposals} disabled={loading}>
          Refresh Proposals
        </Button>
      </Box>

      <Box sx={{ m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Proposals
        </Typography>
        <Grid container spacing={2}>
          {proposals.map((proposal) => (
            <Grid item xs={12} sm={6} md={4} key={proposal.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ID: {proposal.id}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Description: {proposal.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {proposal.state}
                  </Typography>
                </CardContent>
                <CardActions>
                  {proposal.state === "Active" && (
                    <>
                      <Button size="small" onClick={() => voteOnProposal(proposal.id, 1)} disabled={loading}>Vote For</Button>
                      <Button size="small" onClick={() => voteOnProposal(proposal.id, 0)} disabled={loading}>Vote Against</Button>
                    </>
                  )}
                  {proposal.state === "Succeeded" && (
                    <Button size="small" onClick={() => queueProposal(proposal.id)} disabled={loading}>Queue</Button>
                  )}
                  {proposal.state === "Queued" && (
                    <Button size="small" onClick={() => executeProposal(proposal.id)} disabled={loading}>Execute</Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* New Proposal Dialog */}
      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogTitle>Create New Proposal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Proposal Description"
            fullWidth
            variant="outlined"
            value={pDescription}
            onChange={(e) => setPDescription(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Mint Tokens Dialog */}
      <Dialog open={mintOpen} onClose={() => !loading && setMintOpen(false)}>
        <DialogTitle>Mint DAO Tokens</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMintOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={mintTokens} disabled={loading}>Mint</Button>
        </DialogActions>
      </Dialog>

      {/* Delegate Votes Dialog */}
      <Dialog open={delegateOpen} onClose={() => !loading && setDelegateOpen(false)}>
        <DialogTitle>Delegate Votes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Delegate Address"
            fullWidth
            variant="outlined"
            value={delegateAddress}
            onChange={(e) => setDelegateAddress(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDelegateOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={delegateVotes} disabled={loading}>Delegate</Button>
        </DialogActions>
      </Dialog>

      {/* Grant Role Dialog */}
      <Dialog open={grantRoleOpen} onClose={() => !loading && setGrantRoleOpen(false)}>
        <DialogTitle>Grant Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="PROPOSER_ROLE">Proposer</MenuItem>
              <MenuItem value="EXECUTOR_ROLE">Executor</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            variant="outlined"
            value={grantRoleAddress}
            onChange={(e) => setGrantRoleAddress(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrantRoleOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={grantRole} disabled={loading}>Grant</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;