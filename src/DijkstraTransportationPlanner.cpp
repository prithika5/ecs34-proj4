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
