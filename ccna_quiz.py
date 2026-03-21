#!/usr/bin/env python3
"""
CCNA Cisco IOS Commands Quiz
50 questions covering basic commands and routing/switching topics

ANSWER FORMAT SYNCHRONIZATION:
    This file uses letter-based answers: "A", "B", "C", "D"
    The HTML version (ccna_quiz.html) uses index-based: 0, 1, 2, 3

    Mapping: A=0, B=1, C=2, D=3

    When updating questions, ensure BOTH files are updated to maintain sync.
    The HTML version encodes answers for anti-cheat protection.
"""

import random

# Answer mapping for synchronization with HTML version
ANSWER_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}

QUESTIONS = [
    # === BASIC COMMANDS - CLI Modes & Navigation ===
    # Q0: Answer B (index 1)
    {
        "question": "Which command enters global configuration mode from privileged EXEC mode?",
        "options": ["A) enable", "B) configure terminal", "C) config mode", "D) setup"],
        "answer": "B",
        "explanation": "'configure terminal' (or 'conf t') enters global config mode from privileged EXEC."
    },
    # Q1: Answer B (index 1)
    {
        "question": "What prompt indicates you are in privileged EXEC mode?",
        "options": ["A) Router>", "B) Router#", "C) Router(config)#", "D) Router(config-if)#"],
        "answer": "B",
        "explanation": "The # symbol indicates privileged EXEC mode; > indicates user EXEC mode."
    },
    # Q2: Answer B (index 1)
    {
        "question": "Which command moves from user EXEC mode to privileged EXEC mode?",
        "options": ["A) login", "B) enable", "C) privilege", "D) escalate"],
        "answer": "B",
        "explanation": "'enable' elevates from user EXEC (>) to privileged EXEC (#) mode."
    },
    # Q3: Answer C (index 2)
    {
        "question": "What command returns you to privileged EXEC mode from any config mode?",
        "options": ["A) exit", "B) quit", "C) end", "D) disable"],
        "answer": "C",
        "explanation": "'end' (or Ctrl+Z) returns directly to privileged EXEC from any config mode."
    },
    # Q4: Answer A (index 0)
    {
        "question": "Which command enters interface configuration mode for GigabitEthernet0/1?",
        "options": ["A) interface gigabitethernet 0/1", "B) config interface g0/1", "C) enter g0/1", "D) select interface 0/1"],
        "answer": "A",
        "explanation": "'interface gigabitethernet 0/1' (or 'int g0/1') enters interface config mode."
    },
    # === BASIC COMMANDS - Show Commands ===
    # Q5: Answer B (index 1)
    {
        "question": "Which command displays the running configuration?",
        "options": ["A) show config", "B) show running-config", "C) display config", "D) view running"],
        "answer": "B",
        "explanation": "'show running-config' (or 'sh run') displays the active configuration in RAM."
    },
    # Q6: Answer C (index 2)
    {
        "question": "Which command shows the IOS version and hardware information?",
        "options": ["A) show system", "B) show hardware", "C) show version", "D) show info"],
        "answer": "C",
        "explanation": "'show version' displays IOS version, uptime, hardware, and license info."
    },
    # Q7: Answer A (index 0)
    {
        "question": "What command displays all interfaces and their IP addresses?",
        "options": ["A) show ip interface brief", "B) show interfaces all", "C) show ip addresses", "D) display interfaces"],
        "answer": "A",
        "explanation": "'show ip interface brief' shows a summary of interfaces, IPs, and status."
    },
    # Q8: Answer B (index 1)
    {
        "question": "Which command shows the routing table?",
        "options": ["A) show routes", "B) show ip route", "C) display routing", "D) show routing-table"],
        "answer": "B",
        "explanation": "'show ip route' displays the IP routing table with all learned routes."
    },
    # Q9: Answer A (index 0)
    {
        "question": "What command displays the MAC address table on a switch?",
        "options": ["A) show mac-address-table", "B) show mac table", "C) show arp", "D) show addresses"],
        "answer": "A",
        "explanation": "'show mac-address-table' displays the switch's MAC address to port mappings."
    },
    # Q10: Answer B (index 1)
    {
        "question": "Which command shows detailed information about a specific interface?",
        "options": ["A) show interface detail g0/1", "B) show interfaces g0/1", "C) display interface g0/1", "D) show g0/1 status"],
        "answer": "B",
        "explanation": "'show interfaces <interface>' shows detailed statistics and configuration."
    },
    # Q11: Answer D (index 3)
    {
        "question": "What command displays the ARP cache?",
        "options": ["A) show arp", "B) show ip arp", "C) show arp-cache", "D) Both A and B"],
        "answer": "D",
        "explanation": "Both 'show arp' and 'show ip arp' display the ARP cache."
    },
    # === BASIC COMMANDS - Configuration ===
    # Q12: Answer B (index 1)
    {
        "question": "Which command sets the hostname of a device to 'CoreRouter'?",
        "options": ["A) set hostname CoreRouter", "B) hostname CoreRouter", "C) name CoreRouter", "D) device-name CoreRouter"],
        "answer": "B",
        "explanation": "'hostname <name>' sets the device hostname in global config mode."
    },
    # Q13: Answer A (index 0)
    {
        "question": "What command assigns IP address 192.168.1.1/24 to an interface?",
        "options": ["A) ip address 192.168.1.1 255.255.255.0", "B) set ip 192.168.1.1/24", "C) ipaddress 192.168.1.1 /24", "D) address 192.168.1.1 mask 24"],
        "answer": "A",
        "explanation": "'ip address <ip> <subnet-mask>' assigns an IP in interface config mode."
    },
    # Q14: Answer C (index 2)
    {
        "question": "Which command enables an interface that is administratively down?",
        "options": ["A) enable", "B) activate", "C) no shutdown", "D) start"],
        "answer": "C",
        "explanation": "'no shutdown' (or 'no shut') enables an interface."
    },
    # Q15: Answer D (index 3)
    {
        "question": "What command saves the running configuration to NVRAM?",
        "options": ["A) save config", "B) write memory", "C) copy running startup", "D) Both B and C"],
        "answer": "D",
        "explanation": "Both 'write memory' and 'copy running-config startup-config' save the config."
    },
    # Q16: Answer C (index 2)
    {
        "question": "Which command sets the enable secret password to 'cisco123'?",
        "options": ["A) password cisco123", "B) enable password cisco123", "C) enable secret cisco123", "D) secret enable cisco123"],
        "answer": "C",
        "explanation": "'enable secret' sets an encrypted password for privileged EXEC access."
    },
    # Q17: Answer A (index 0)
    {
        "question": "What command configures a description on an interface?",
        "options": ["A) description Link to WAN", "B) name Link to WAN", "C) label Link to WAN", "D) comment Link to WAN"],
        "answer": "A",
        "explanation": "'description <text>' adds a description to an interface."
    },
    # Q18: Answer B (index 1)
    {
        "question": "Which command disables DNS lookup on a router?",
        "options": ["A) no dns lookup", "B) no ip domain-lookup", "C) dns disable", "D) ip dns off"],
        "answer": "B",
        "explanation": "'no ip domain-lookup' prevents the router from trying to resolve typos as hostnames."
    },
    # Q19: Answer C (index 2)
    {
        "question": "What command encrypts all plain-text passwords in the config?",
        "options": ["A) encrypt passwords", "B) password encryption", "C) service password-encryption", "D) enable encryption"],
        "answer": "C",
        "explanation": "'service password-encryption' encrypts passwords using type 7 encryption."
    },
    # === BASIC COMMANDS - Line Configuration ===
    # Q20: Answer A (index 0)
    {
        "question": "Which command enters console line configuration mode?",
        "options": ["A) line console 0", "B) console line 0", "C) config console", "D) line con"],
        "answer": "A",
        "explanation": "'line console 0' enters console line configuration mode."
    },
    # Q21: Answer B (index 1)
    {
        "question": "What command configures VTY lines 0-4 for remote access?",
        "options": ["A) vty 0 4", "B) line vty 0 4", "C) remote-access 0-4", "D) telnet lines 0 4"],
        "answer": "B",
        "explanation": "'line vty 0 4' configures virtual terminal lines for SSH/Telnet."
    },
    # Q22: Answer A (index 0)
    {
        "question": "Which command sets a console password and enables login?",
        "options": ["A) password cisco then login", "B) set password cisco", "C) console password cisco", "D) enable login cisco"],
        "answer": "A",
        "explanation": "Set 'password <pwd>' then 'login' to require password on console."
    },
    # Q23: Answer B (index 1)
    {
        "question": "What command prevents console messages from interrupting your typing?",
        "options": ["A) no messages", "B) logging synchronous", "C) quiet mode", "D) disable logging"],
        "answer": "B",
        "explanation": "'logging synchronous' re-displays your command after syslog messages."
    },
    # Q24: Answer B (index 1)
    {
        "question": "Which command sets the console timeout to 10 minutes?",
        "options": ["A) timeout 10", "B) exec-timeout 10 0", "C) session-timeout 10", "D) idle-timeout 10"],
        "answer": "B",
        "explanation": "'exec-timeout <minutes> <seconds>' sets the idle timeout period."
    },
    # === VLANs ===
    # Q25: Answer A (index 0)
    {
        "question": "Which command creates VLAN 100 on a switch?",
        "options": ["A) vlan 100", "B) create vlan 100", "C) add vlan 100", "D) new vlan 100"],
        "answer": "A",
        "explanation": "'vlan 100' in global config mode creates the VLAN and enters VLAN config."
    },
    # Q26: Answer B (index 1)
    {
        "question": "What command assigns a name to a VLAN?",
        "options": ["A) vlan name Sales", "B) name Sales", "C) description Sales", "D) label Sales"],
        "answer": "B",
        "explanation": "'name <name>' assigns a name to a VLAN in VLAN configuration mode."
    },
    # Q27: Answer B (index 1)
    {
        "question": "Which command assigns an interface to VLAN 10 as an access port?",
        "options": ["A) vlan 10", "B) switchport access vlan 10", "C) access vlan 10", "D) port vlan 10"],
        "answer": "B",
        "explanation": "'switchport access vlan 10' assigns the port to VLAN 10."
    },
    # Q28: Answer B (index 1)
    {
        "question": "What command configures a port as an access port?",
        "options": ["A) port mode access", "B) switchport mode access", "C) access mode enable", "D) mode access"],
        "answer": "B",
        "explanation": "'switchport mode access' sets the port to access mode (single VLAN)."
    },
    # Q29: Answer B (index 1)
    {
        "question": "Which command displays all VLANs and their port assignments?",
        "options": ["A) show vlans", "B) show vlan brief", "C) display vlan", "D) show vlan all"],
        "answer": "B",
        "explanation": "'show vlan brief' displays a summary of VLANs and assigned ports."
    },
    # Q30: Answer C (index 2)
    {
        "question": "What command configures an interface as a trunk port?",
        "options": ["A) switchport trunk", "B) trunk enable", "C) switchport mode trunk", "D) mode trunk"],
        "answer": "C",
        "explanation": "'switchport mode trunk' configures the port to carry multiple VLANs."
    },
    # Q31: Answer C (index 2)
    {
        "question": "Which command sets the native VLAN on a trunk to VLAN 99?",
        "options": ["A) native vlan 99", "B) switchport native vlan 99", "C) switchport trunk native vlan 99", "D) trunk native 99"],
        "answer": "C",
        "explanation": "'switchport trunk native vlan 99' sets VLAN 99 as the native VLAN."
    },
    # Q32: Answer A (index 0)
    {
        "question": "What command restricts a trunk to only allow VLANs 10, 20, and 30?",
        "options": ["A) switchport trunk allowed vlan 10,20,30", "B) trunk vlan 10 20 30", "C) vlan allow 10,20,30", "D) permit vlan 10,20,30"],
        "answer": "A",
        "explanation": "'switchport trunk allowed vlan 10,20,30' restricts the trunk to specific VLANs."
    },
    # Q33: Answer B (index 1)
    {
        "question": "Which command configures a Layer 3 switch interface with an IP address?",
        "options": ["A) ip address after switchport", "B) no switchport then ip address", "C) layer3 mode then ip address", "D) routed-port ip address"],
        "answer": "B",
        "explanation": "'no switchport' converts a switch port to a routed port, then assign IP."
    },
    # Q34: Answer A (index 0)
    {
        "question": "What command creates a switch virtual interface for VLAN 10?",
        "options": ["A) interface vlan 10", "B) vlan interface 10", "C) svi vlan 10", "D) create svi 10"],
        "answer": "A",
        "explanation": "'interface vlan 10' creates an SVI for inter-VLAN routing."
    },
    # === Spanning Tree Protocol (STP) ===
    # Q35: Answer B (index 1)
    {
        "question": "Which command displays spanning tree information?",
        "options": ["A) show stp", "B) show spanning-tree", "C) show tree", "D) display spanning-tree"],
        "answer": "B",
        "explanation": "'show spanning-tree' displays STP status, root bridge, and port states."
    },
    # Q36: Answer B (index 1)
    {
        "question": "What command sets a switch as the root bridge for VLAN 1?",
        "options": ["A) spanning-tree root primary", "B) spanning-tree vlan 1 root primary", "C) stp vlan 1 priority 0", "D) root-bridge vlan 1"],
        "answer": "B",
        "explanation": "'spanning-tree vlan 1 root primary' sets low priority to become root."
    },
    # Q37: Answer B (index 1)
    {
        "question": "Which command enables PortFast on an access port?",
        "options": ["A) portfast enable", "B) spanning-tree portfast", "C) stp portfast", "D) fast-port"],
        "answer": "B",
        "explanation": "'spanning-tree portfast' skips STP listening/learning states."
    },
    # Q38: Answer C (index 2)
    {
        "question": "What command enables BPDU Guard on a PortFast-enabled port?",
        "options": ["A) bpdu-guard enable", "B) spanning-tree guard bpdu", "C) spanning-tree bpduguard enable", "D) stp bpdu guard"],
        "answer": "C",
        "explanation": "'spanning-tree bpduguard enable' shuts down port if BPDU is received."
    },
    # Q39: Answer B (index 1)
    {
        "question": "Which command changes STP mode to Rapid PVST+?",
        "options": ["A) spanning-tree mode rapid", "B) spanning-tree mode rapid-pvst", "C) stp mode rstp", "D) rapid-pvst enable"],
        "answer": "B",
        "explanation": "'spanning-tree mode rapid-pvst' enables Rapid PVST+ on the switch."
    },
    # Q40: Answer A (index 0)
    {
        "question": "What command manually sets the STP priority to 4096 for VLAN 10?",
        "options": ["A) spanning-tree vlan 10 priority 4096", "B) stp priority 4096 vlan 10", "C) spanning-tree priority 4096", "D) vlan 10 stp-priority 4096"],
        "answer": "A",
        "explanation": "'spanning-tree vlan 10 priority 4096' sets specific priority (must be multiple of 4096)."
    },
    # === OSPF ===
    # Q41: Answer B (index 1)
    {
        "question": "Which command enables OSPF process 1 on a router?",
        "options": ["A) ospf 1", "B) router ospf 1", "C) enable ospf 1", "D) protocol ospf 1"],
        "answer": "B",
        "explanation": "'router ospf 1' enters OSPF router configuration mode with process ID 1."
    },
    # Q42: Answer B (index 1)
    {
        "question": "What command advertises network 10.0.0.0/24 in OSPF area 0?",
        "options": ["A) network 10.0.0.0 255.255.255.0 area 0", "B) network 10.0.0.0 0.0.0.255 area 0", "C) advertise 10.0.0.0/24 area 0", "D) ospf network 10.0.0.0 area 0"],
        "answer": "B",
        "explanation": "OSPF uses wildcard masks. '0.0.0.255' is the wildcard for /24."
    },
    # Q43: Answer B (index 1)
    {
        "question": "Which command displays OSPF neighbor relationships?",
        "options": ["A) show ospf neighbors", "B) show ip ospf neighbor", "C) show ospf adjacency", "D) display ospf peers"],
        "answer": "B",
        "explanation": "'show ip ospf neighbor' displays OSPF adjacencies and their states."
    },
    # Q44: Answer B (index 1)
    {
        "question": "What command sets the OSPF router ID to 1.1.1.1?",
        "options": ["A) ospf router-id 1.1.1.1", "B) router-id 1.1.1.1", "C) id 1.1.1.1", "D) set router-id 1.1.1.1"],
        "answer": "B",
        "explanation": "'router-id 1.1.1.1' manually sets the OSPF router ID."
    },
    # Q45: Answer A (index 0)
    {
        "question": "Which command shows the OSPF link-state database?",
        "options": ["A) show ip ospf database", "B) show ospf lsdb", "C) show ip ospf lsa", "D) display ospf database"],
        "answer": "A",
        "explanation": "'show ip ospf database' displays the LSDB with all LSAs."
    },
    # Q46: Answer B (index 1)
    {
        "question": "What command changes the OSPF cost on an interface to 100?",
        "options": ["A) ospf cost 100", "B) ip ospf cost 100", "C) cost 100", "D) bandwidth cost 100"],
        "answer": "B",
        "explanation": "'ip ospf cost 100' manually sets the OSPF cost in interface config."
    },
    # Q47: Answer A (index 0)
    {
        "question": "Which command configures OSPF authentication using MD5 on an interface?",
        "options": ["A) ip ospf authentication message-digest", "B) ospf auth md5", "C) authentication ospf md5", "D) ip ospf md5 enable"],
        "answer": "A",
        "explanation": "'ip ospf authentication message-digest' enables MD5 authentication."
    },
    # Q48: Answer B (index 1)
    {
        "question": "What command makes an interface passive in OSPF (no hellos sent)?",
        "options": ["A) passive interface g0/1", "B) passive-interface g0/1", "C) interface g0/1 passive", "D) ospf passive g0/1"],
        "answer": "B",
        "explanation": "'passive-interface <int>' stops OSPF from sending hellos on that interface."
    },
    # === EIGRP ===
    # Q49: Answer B (index 1)
    {
        "question": "Which command enables EIGRP with AS number 100?",
        "options": ["A) eigrp 100", "B) router eigrp 100", "C) enable eigrp 100", "D) protocol eigrp 100"],
        "answer": "B",
        "explanation": "'router eigrp 100' enters EIGRP configuration with AS 100."
    },
    # Q50: Answer B (index 1)
    {
        "question": "What command disables auto-summarization in EIGRP?",
        "options": ["A) no summarization", "B) no auto-summary", "C) disable auto-summary", "D) summary disable"],
        "answer": "B",
        "explanation": "'no auto-summary' disables automatic summarization at classful boundaries."
    },
    # Q51: Answer B (index 1)
    {
        "question": "Which command shows EIGRP neighbors?",
        "options": ["A) show eigrp neighbors", "B) show ip eigrp neighbors", "C) show eigrp peers", "D) display eigrp adjacency"],
        "answer": "B",
        "explanation": "'show ip eigrp neighbors' displays EIGRP neighbor table."
    },
    # Q52: Answer B (index 1)
    {
        "question": "What command displays the EIGRP topology table?",
        "options": ["A) show eigrp topology", "B) show ip eigrp topology", "C) show eigrp routes", "D) display eigrp table"],
        "answer": "B",
        "explanation": "'show ip eigrp topology' shows feasible successors and topology."
    },
    # Q53: Answer B (index 1)
    {
        "question": "Which command sets the EIGRP bandwidth percentage on an interface to 50%?",
        "options": ["A) eigrp bandwidth 50", "B) ip bandwidth-percent eigrp 100 50", "C) bandwidth eigrp 50", "D) eigrp 100 bandwidth 50"],
        "answer": "B",
        "explanation": "'ip bandwidth-percent eigrp <AS> <percent>' limits EIGRP bandwidth usage."
    },
    # === Static & Default Routes ===
    # Q54: Answer B (index 1)
    {
        "question": "Which command creates a static route to 192.168.10.0/24 via 10.0.0.2?",
        "options": ["A) route 192.168.10.0 255.255.255.0 10.0.0.2", "B) ip route 192.168.10.0 255.255.255.0 10.0.0.2", "C) static route 192.168.10.0/24 10.0.0.2", "D) add route 192.168.10.0 via 10.0.0.2"],
        "answer": "B",
        "explanation": "'ip route <network> <mask> <next-hop>' creates a static route."
    },
    # Q55: Answer B (index 1)
    {
        "question": "What command creates a default route pointing to 10.0.0.1?",
        "options": ["A) ip route default 10.0.0.1", "B) ip route 0.0.0.0 0.0.0.0 10.0.0.1", "C) default-gateway 10.0.0.1", "D) ip default-route 10.0.0.1"],
        "answer": "B",
        "explanation": "'ip route 0.0.0.0 0.0.0.0 <next-hop>' is the default route (gateway of last resort)."
    },
    # Q56: Answer A (index 0)
    {
        "question": "Which command creates a floating static route with AD of 200?",
        "options": ["A) ip route 10.0.0.0 255.0.0.0 192.168.1.1 200", "B) ip route 10.0.0.0 255.0.0.0 192.168.1.1 ad 200", "C) ip route 10.0.0.0 255.0.0.0 192.168.1.1 metric 200", "D) ip route 10.0.0.0 255.0.0.0 192.168.1.1 cost 200"],
        "answer": "A",
        "explanation": "Adding a number after next-hop sets the administrative distance."
    },
    # Q57: Answer B (index 1)
    {
        "question": "What does 'S*' indicate in the routing table output?",
        "options": ["A) Static summary route", "B) Static route that is the default gateway", "C) Stub area route", "D) Secured static route"],
        "answer": "B",
        "explanation": "'S*' indicates a static default route (gateway of last resort)."
    },
]


def run_quiz():
    """Run the interactive quiz."""
    print("\n" + "=" * 60)
    print("       CCNA Cisco IOS Commands Quiz")
    print("       50 Questions - Basic Commands & Routing/Switching")
    print("=" * 60)
    print("\nInstructions:")
    print("- Enter the letter of your answer (A, B, C, or D)")
    print("- Type 'quit' to exit the quiz early")
    print("- Your score will be shown at the end\n")

    input("Press Enter to begin...")

    # Shuffle questions for variety
    questions = QUESTIONS.copy()
    random.shuffle(questions)

    score = 0
    total = len(questions)
    answered = 0

    for i, q in enumerate(questions, 1):
        print("\n" + "-" * 60)
        print(f"Question {i}/{total}")
        print("-" * 60)
        print(f"\n{q['question']}\n")

        for option in q['options']:
            print(f"  {option}")

        while True:
            answer = input("\nYour answer (A/B/C/D): ").strip().upper()

            if answer == 'QUIT':
                print(f"\nQuiz ended early. Final score: {score}/{answered}")
                if answered > 0:
                    percentage = (score / answered) * 100
                    print(f"Percentage: {percentage:.1f}%")
                return

            if answer in ['A', 'B', 'C', 'D']:
                break
            print("Invalid input. Please enter A, B, C, or D.")

        answered += 1

        if answer == q['answer']:
            score += 1
            print("\n[CORRECT]")
        else:
            print(f"\n[INCORRECT] The correct answer is: {q['answer']}")

        print(f"Explanation: {q['explanation']}")
        print(f"\nRunning score: {score}/{answered}")

    # Final results
    print("\n" + "=" * 60)
    print("                    QUIZ COMPLETE!")
    print("=" * 60)
    print(f"\nFinal Score: {score}/{total}")
    percentage = (score / total) * 100
    print(f"Percentage: {percentage:.1f}%")

    if percentage >= 90:
        print("\nExcellent! You're well prepared for the CCNA!")
    elif percentage >= 80:
        print("\nGreat job! A bit more practice and you'll ace it!")
    elif percentage >= 70:
        print("\nGood effort! Review the topics you missed.")
    elif percentage >= 60:
        print("\nKeep studying! Focus on the areas where you struggled.")
    else:
        print("\nMore practice needed. Review the Cisco IOS fundamentals.")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    run_quiz()
