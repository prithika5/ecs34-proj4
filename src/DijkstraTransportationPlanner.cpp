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
    (void)src;
    (void)dest;
    return CPathRouter::NoPathExists;
}

double CDijkstraTransportationPlanner::FindFastestPath(TNodeID src, TNodeID dest, std::vector<TTripStep> &path){
    path.clear();
    (void)src;
    (void)dest;
    return CPathRouter::NoPathExists;
}

bool CDijkstraTransportationPlanner::GetPathDescription(const std::vector<TTripStep> &path, std::vector<std::string> &desc) const{
    (void)path;
    desc.clear();
    return false;
}
