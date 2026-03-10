#include "DijkstraTransportationPlanner.h"

#include "BusSystemIndexer.h"
#include "GeographicUtils.h"
#include "StringUtils.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cctype>
#include <functional>
#include <iomanip>
#include <limits>
#include <queue>
#include <sstream>
#include <unordered_map>
#include <unordered_set>
#include <vector>

struct CDijkstraTransportationPlanner::SImplementation{
    using TNodeID = CTransportationPlanner::TNodeID;
    using TStopID = CBusSystem::TStopID;
    using TMode = CTransportationPlanner::ETransportationMode;

    struct SDirectedEdge{
        TNodeID DDestination = CStreetMap::InvalidNodeID;
        double DDistanceMiles = 0.0;
        double DTimeHours = 0.0;
        TMode DMode = TMode::Walk;
    };

    struct SWayInfo{
        double DDistanceMiles = 0.0;
        double DSpeed = 0.0;
        std::string DName;
    };

    struct SPairHash{
        std::size_t operator()(const std::pair<TNodeID,TNodeID> &v) const noexcept{
            return static_cast<std::size_t>(v.first ^ (v.second << 1));
        }
    };

    std::shared_ptr<SConfiguration> DConfig;
    std::shared_ptr<CStreetMap> DStreetMap;
    std::shared_ptr<CBusSystem> DBusSystem;
    std::vector<std::shared_ptr<CStreetMap::SNode>> DSortedNodes;
    std::unordered_map<TNodeID,std::shared_ptr<CStreetMap::SNode>> DNodeByID;
    std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DShortEdges;
    std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DWalkEdges;
    std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DBikeEdges;
    std::unordered_map<TNodeID,std::vector<SDirectedEdge>> DBusEdges;
    std::unordered_map<std::pair<TNodeID,TNodeID>,SWayInfo,SPairHash> DWayInfo;
    std::unordered_map<TNodeID,TStopID> DStopByNode;
    std::unordered_map<std::pair<TNodeID,TNodeID>,std::unordered_set<std::string>,SPairHash> DRouteNames;

    static bool IsOneWay(const std::string &v){
        auto s = StringUtils::Lower(StringUtils::Strip(v));
        return s == "yes" || s == "true" || s == "1";
    }

    static bool BikeAllowed(const std::string &v){
        auto s = StringUtils::Lower(StringUtils::Strip(v));
        return s != "no";
    }

    static double ParseSpeed(const std::string &v, double d){
        std::string s = StringUtils::Lower(StringUtils::Strip(v));
        std::string n;
        for(char c : s){
            if((c >= '0' && c <= '9') || c == '.'){
                n.push_back(c);
            }
            else if(!n.empty()){
                break;
            }
        }
        if(n.empty()){
            return d;
        }
        return std::stod(n);
    }

    void AddEdge(std::unordered_map<TNodeID,std::vector<SDirectedEdge>> &m, TNodeID a, TNodeID b, double dist, double time, TMode mode){
        SDirectedEdge e;
        e.DDestination = b;
        e.DDistanceMiles = dist;
        e.DTimeHours = time;
        e.DMode = mode;
        m[a].push_back(e);
    }

    void BuildRoadEdges(){
        if(!DStreetMap){
            return;
        }
        double ws = DConfig ? DConfig->WalkSpeed() : 3.0;
        double bs = DConfig ? DConfig->BikeSpeed() : 8.0;
        double ds = DConfig ? DConfig->DefaultSpeedLimit() : 25.0;
        if(ws <= 0.0){
            ws = 3.0;
        }
        if(bs <= 0.0){
            bs = 8.0;
        }
        if(ds <= 0.0){
            ds = 25.0;
        }
        for(std::size_t i = 0; i < DStreetMap->WayCount(); i++){
            auto way = DStreetMap->WayByIndex(i);
            if(!way){
                continue;
            }
            bool oneway = way->HasAttribute("oneway") && IsOneWay(way->GetAttribute("oneway"));
            bool bikeok = !way->HasAttribute("bicycle") || BikeAllowed(way->GetAttribute("bicycle"));
            std::string name;
            if(way->HasAttribute("name")){
                name = way->GetAttribute("name");
            }
            double speed = ds;
            if(way->HasAttribute("maxspeed")){
                speed = ParseSpeed(way->GetAttribute("maxspeed"), ds);
            }
            if(speed <= 0.0){
                speed = ds;
            }

            for(std::size_t j = 1; j < way->NodeCount(); j++){
                TNodeID a = way->GetNodeID(j - 1);
                TNodeID b = way->GetNodeID(j);
                auto na = DStreetMap->NodeByID(a);
                auto nb = DStreetMap->NodeByID(b);
                if(!na || !nb){
                    continue;
                }
                double dist = SGeographicUtils::HaversineDistanceInMiles(na->Location(), nb->Location());
                if(dist < 0.0){
                    continue;
                }
                SWayInfo w;
                w.DDistanceMiles = dist;
                w.DSpeed = speed;
                w.DName = name;
                DWayInfo[std::make_pair(a,b)] = w;
                DWayInfo[std::make_pair(b,a)] = w;
                AddEdge(DWalkEdges, a, b, dist, dist / ws, TMode::Walk);
                AddEdge(DWalkEdges, b, a, dist, dist / ws, TMode::Walk);
                if(oneway){
                    AddEdge(DShortEdges, a, b, dist, dist, TMode::Walk);
                }
                else{
                    AddEdge(DShortEdges, a, b, dist, dist, TMode::Walk);
                    AddEdge(DShortEdges, b, a, dist, dist, TMode::Walk);
                }
                if(bikeok){
                    AddEdge(DBikeEdges, a, b, dist, dist / bs, TMode::Bike);
                    if(!oneway){
                        AddEdge(DBikeEdges, b, a, dist, dist / bs, TMode::Bike);
                    }
                }
            }
        }
    }

    void BuildBusEdges(){
        if(!DBusSystem){
            return;
        }
        double stopt = DConfig ? DConfig->BusStopTime() : 30.0;
        if(stopt < 0.0){
            stopt = 0.0;
        }
        double stoph = stopt / 3600.0;

        for(std::size_t i = 0; i < DBusSystem->RouteCount(); i++){
            auto route = DBusSystem->RouteByIndex(i);
            if(!route){
                continue;
            }
            if(route->StopCount() < 2){
                continue;
            }
            for(std::size_t j = 1; j < route->StopCount(); j++){
                auto sa = DBusSystem->StopByID(route->GetStopID(j - 1));
                auto sb = DBusSystem->StopByID(route->GetStopID(j));
                if(!sa || !sb){
                    continue;
                }
                TNodeID a = sa->NodeID();
                TNodeID b = sb->NodeID();
                DRouteNames[std::make_pair(a,b)].insert(route->Name());

                std::vector<TNodeID> busnodes;
                std::vector<TMode> busmodes;
                double dist = CPathRouter::NoPathExists;
                if(!FindPath(DShortEdges, a, b, busnodes, busmodes, dist)){
                    continue;
                }
                double time = 0.0;
                for(std::size_t k = 1; k < busnodes.size(); k++){
                    auto it = DWayInfo.find(std::make_pair(busnodes[k - 1],busnodes[k]));
                    if(it == DWayInfo.end()){
                        time = CPathRouter::NoPathExists;
                        break;
                    }
                    if(it->second.DSpeed <= 0.0){
                        time = CPathRouter::NoPathExists;
                        break;
                    }
                    time += it->second.DDistanceMiles / it->second.DSpeed;
                }
                if(time == CPathRouter::NoPathExists){
                    continue;
                }
                time += stoph;
                AddEdge(DBusEdges, a, b, dist, time, TMode::Bus);
            }
        }
    }

    bool FindPath(const std::unordered_map<TNodeID,std::vector<SDirectedEdge>> &m, TNodeID src, TNodeID dst, std::vector<TNodeID> &outnodes, std::vector<TMode> &outmodes, double &outcost) const{
        outnodes.clear();
        outmodes.clear();
        outcost = CPathRouter::NoPathExists;
        if(src == dst){
            if(DNodeByID.find(src) == DNodeByID.end()){
                return false;
            }
            outnodes.push_back(src);
            outcost = 0.0;
            return true;
        }
        if(DNodeByID.find(src) == DNodeByID.end() || DNodeByID.find(dst) == DNodeByID.end()){
            return false;
        }

        struct SState{
            double d;
            TNodeID n;
            bool operator>(const SState &o) const{
                return d > o.d;
            }
        };

        std::unordered_map<TNodeID,double> dist;
        std::unordered_map<TNodeID,TNodeID> prev;
        std::unordered_map<TNodeID,TMode> pmode;
        for(const auto &p : DNodeByID){
            dist[p.first] = CPathRouter::NoPathExists;
        }
        dist[src] = 0.0;

        std::priority_queue<SState,std::vector<SState>,std::greater<SState>> pq;
        pq.push({0.0,src});

        while(!pq.empty()){
            auto cur = pq.top();
            pq.pop();
            if(cur.d != dist[cur.n]){
                continue;
            }
            if(cur.n == dst){
                break;
            }
            auto it = m.find(cur.n);
            if(it == m.end()){
                continue;
            }
            for(const auto &e : it->second){
                double nd = cur.d + e.DTimeHours;
                if(nd < dist[e.DDestination]){
                    dist[e.DDestination] = nd;
                    prev[e.DDestination] = cur.n;
                    pmode[e.DDestination] = e.DMode;
                    pq.push({nd,e.DDestination});
                }
            }
        }

        if(dist[dst] == CPathRouter::NoPathExists){
            return false;
        }

        std::vector<TNodeID> revnodes;
        std::vector<TMode> revmodes;
        TNodeID cur = dst;
        revnodes.push_back(cur);
        while(cur != src){
            auto pit = prev.find(cur);
            if(pit == prev.end()){
                return false;
            }
            revmodes.push_back(pmode[cur]);
            cur = pit->second;
            revnodes.push_back(cur);
        }
        std::reverse(revnodes.begin(), revnodes.end());
        std::reverse(revmodes.begin(), revmodes.end());
        outnodes = std::move(revnodes);
        outmodes = std::move(revmodes);
        outcost = dist[dst];
        return true;
    }

    std::vector<CTransportationPlanner::TTripStep> BuildTrip(const std::vector<TNodeID> &nodes, const std::vector<TMode> &modes) const{
        std::vector<CTransportationPlanner::TTripStep> out;
        if(nodes.empty()){
            return out;
        }
        if(nodes.size() == 1){
            out.push_back(std::make_pair(TMode::Walk, nodes[0]));
            return out;
        }
        TMode first = modes.empty() ? TMode::Walk : modes[0];
        if(first == TMode::Bus){
            out.push_back(std::make_pair(TMode::Walk, nodes[0]));
        }
        else{
            out.push_back(std::make_pair(first, nodes[0]));
        }
        for(std::size_t i = 1; i < nodes.size(); i++){
            TMode m = TMode::Walk;
            if(i - 1 < modes.size()){
                m = modes[i - 1];
            }
            out.push_back(std::make_pair(m, nodes[i]));
        }
        return out;
    }

    std::unordered_map<TNodeID,std::vector<SDirectedEdge>> Merge(const std::unordered_map<TNodeID,std::vector<SDirectedEdge>> &a, const std::unordered_map<TNodeID,std::vector<SDirectedEdge>> &b) const{
        auto out = a;
        for(const auto &p : b){
            auto &v = out[p.first];
            for(const auto &e : p.second){
                v.push_back(e);
            }
        }
        return out;
    }

    SImplementation(std::shared_ptr<SConfiguration> config)
        : DConfig(std::move(config)){
        if(DConfig){
            DStreetMap = DConfig->StreetMap();
            DBusSystem = DConfig->BusSystem();
        }

        if(DStreetMap){
            DSortedNodes.reserve(DStreetMap->NodeCount());
            for(std::size_t Index = 0; Index < DStreetMap->NodeCount(); Index++){
                auto Node = DStreetMap->NodeByIndex(Index);
                if(Node){
                    DSortedNodes.push_back(Node);
                    DNodeByID[Node->ID()] = Node;
                }
            }
            std::sort(DSortedNodes.begin(), DSortedNodes.end(), [](const auto &Left, const auto &Right){
                return Left->ID() < Right->ID();
            });
        }
        if(DBusSystem){
            for(std::size_t i = 0; i < DBusSystem->StopCount(); i++){
                auto stop = DBusSystem->StopByIndex(i);
                if(stop){
                    DStopByNode[stop->NodeID()] = stop->ID();
                }
            }
        }
        BuildRoadEdges();
        BuildBusEdges();
    }

    std::size_t NodeCount() const noexcept{
        return DSortedNodes.size();
    }

    std::shared_ptr<CStreetMap::SNode> SortedNodeByIndex(std::size_t index) const noexcept{
        if(index >= DSortedNodes.size()){
            return nullptr;
        }
        return DSortedNodes[index];
    }
};

CDijkstraTransportationPlanner::CDijkstraTransportationPlanner(std::shared_ptr<SConfiguration> config){
    DImplementation = std::make_unique<SImplementation>(std::move(config));
}

CDijkstraTransportationPlanner::~CDijkstraTransportationPlanner() = default;

std::size_t CDijkstraTransportationPlanner::NodeCount() const noexcept{
    return DImplementation->NodeCount();
}

std::shared_ptr<CStreetMap::SNode> CDijkstraTransportationPlanner::SortedNodeByIndex(std::size_t index) const noexcept{
    return DImplementation->SortedNodeByIndex(index);
}

double CDijkstraTransportationPlanner::FindShortestPath(TNodeID src, TNodeID dest, std::vector<TNodeID> &path){
    path.clear();
    std::vector<ETransportationMode> modes;
    double cost = CPathRouter::NoPathExists;
    if(!DImplementation->FindPath(DImplementation->DShortEdges, src, dest, path, modes, cost)){
        return CPathRouter::NoPathExists;
    }
    return cost;
}

double CDijkstraTransportationPlanner::FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path){
    path.clear();
    auto g1 = DImplementation->Merge(DImplementation->DWalkEdges, DImplementation->DBusEdges);
    auto g2 = DImplementation->Merge(DImplementation->DWalkEdges, DImplementation->DBikeEdges);

    std::vector<TNodeID> n1;
    std::vector<ETransportationMode> m1;
    double c1 = CPathRouter::NoPathExists;
    bool ok1 = DImplementation->FindPath(g1, src, dest, n1, m1, c1);

    std::vector<TNodeID> n2;
    std::vector<ETransportationMode> m2;
    double c2 = CPathRouter::NoPathExists;
    bool ok2 = DImplementation->FindPath(g2, src, dest, n2, m2, c2);

    if(!ok1 && !ok2){
        return CPathRouter::NoPathExists;
    }
    if(ok1 && (!ok2 || c1 <= c2)){
        path = DImplementation->BuildTrip(n1, m1);
        return c1;
    }
    path = DImplementation->BuildTrip(n2, m2);
    return c2;
}

bool CDijkstraTransportationPlanner::GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const{
    (void)path;
    desc.clear();
    return false;
}
