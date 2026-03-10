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

    static std::string ModeName(TMode m){
        if(m == TMode::Walk){
            return "Walk";
        }
        if(m == TMode::Bike){
            return "Bike";
        }
        return "Bus";
    }

    double Distance(TNodeID a, TNodeID b) const{
        auto it = DWayInfo.find(std::make_pair(a,b));
        if(it != DWayInfo.end()){
            return it->second.DDistanceMiles;
        }
        auto na = DStreetMap ? DStreetMap->NodeByID(a) : nullptr;
        auto nb = DStreetMap ? DStreetMap->NodeByID(b) : nullptr;
        if(!na || !nb){
            return 0.0;
        }
        return SGeographicUtils::HaversineDistanceInMiles(na->Location(), nb->Location());
    }

    std::string WayName(TNodeID a, TNodeID b) const{
        auto it = DWayInfo.find(std::make_pair(a,b));
        if(it == DWayInfo.end()){
            return "";
        }
        return it->second.DName;
    }

    std::string BusRoute(const std::vector<CTransportationPlanner::TTripStep> &path, std::size_t i, std::size_t &j) const{
        j = i;
        if(i + 1 >= path.size()){
            return "";
        }
        auto a = path[i].second;
        auto b = path[i + 1].second;
        auto it = DRouteNames.find(std::make_pair(a,b));
        if(it == DRouteNames.end() || it->second.empty()){
            return "";
        }
        std::string best = "";
        std::size_t bestj = i + 1;
        for(const auto &name : it->second){
            std::size_t cur = i + 1;
            while(cur < path.size() - 1){
                auto x = path[cur].second;
                auto y = path[cur + 1].second;
                auto rit = DRouteNames.find(std::make_pair(x,y));
                if(rit == DRouteNames.end() || rit->second.find(name) == rit->second.end()){
                    break;
                }
                cur++;
            }
            if(best.empty() || cur > bestj || (cur == bestj && name < best)){
                best = name;
                bestj = cur;
            }
        }
        j = bestj;
        return best;
    }

    bool BuildDescription(const std::vector<CTransportationPlanner::TTripStep> &path, std::vector<std::string> &desc) const{
        desc.clear();
        if(path.empty()){
            return false;
        }
        auto first = DStreetMap ? DStreetMap->NodeByID(path.front().second) : nullptr;
        auto last = DStreetMap ? DStreetMap->NodeByID(path.back().second) : nullptr;
        if(!first || !last){
            return false;
        }
        desc.push_back("Start at " + SGeographicUtils::ConvertLLToDMS(first->Location()));

        std::size_t i = 0;
        while(i + 1 < path.size()){
            auto mode = path[i + 1].first;
            if(mode == TMode::Bus){
                std::size_t j = i + 1;
                std::string r = BusRoute(path, i, j);
                if(r.empty()){
                    return false;
                }
                auto s1 = DStopByNode.find(path[i].second);
                auto s2 = DStopByNode.find(path[j].second);
                if(s1 == DStopByNode.end() || s2 == DStopByNode.end()){
                    return false;
                }
                desc.push_back("Take Bus " + r + " from stop " + std::to_string(s1->second) + " to stop " + std::to_string(s2->second));
                i = j;
                continue;
            }

            std::size_t j = i + 1;
            double dist = Distance(path[i].second, path[i + 1].second);
            std::string cur = WayName(path[i].second, path[i + 1].second);
            while(j + 1 < path.size() && path[j + 1].first == mode){
                std::string nxt = WayName(path[j].second, path[j + 1].second);
                if(!cur.empty() && nxt != cur){
                    break;
                }
                if(cur.empty() && !nxt.empty()){
                    break;
                }
                dist += Distance(path[j].second, path[j + 1].second);
                if(cur.empty()){
                    cur = nxt;
                }
                j++;
            }
            auto n1 = DStreetMap->NodeByID(path[i].second);
            auto n2 = DStreetMap->NodeByID(path[j].second);
            if(!n1 || !n2){
                return false;
            }
            auto dir = SGeographicUtils::BearingToDirection(SGeographicUtils::CalculateBearing(n1->Location(), n2->Location()));
                std::string target = cur;
                std::string word = "along";
                if(target.empty()){
                    word = "toward";
                    std::size_t k = j;
                    while(k < path.size() - 1){
                        auto name = WayName(path[k].second, path[k + 1].second);
                        if(!name.empty()){
                            target = name;
                            break;
                    }
                    k++;
                }
                if(target.empty()){
                    target = "End";
                }
            }
            std::ostringstream out;
            out << ModeName(mode) << " " << dir << " " << word << " " << target << " for " << std::fixed << std::setprecision(1) << dist << " mi";
            desc.push_back(out.str());
            i = j;
        }

        desc.push_back("End at " + SGeographicUtils::ConvertLLToDMS(last->Location()));
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
    return DImplementation->BuildDescription(path, desc);
}
