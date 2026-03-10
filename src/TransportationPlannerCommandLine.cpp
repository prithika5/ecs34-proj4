#include "TransportationPlannerCommandLine.h"

#include "GeographicUtils.h"
#include "StringUtils.h"

#include <cmath>
#include <cstdint>
#include <sstream>

struct CTransportationPlannerCommandLine::SImplementation{
    std::shared_ptr<CDataSource> src;
    std::shared_ptr<CDataSink> out;
    std::shared_ptr<CDataSink> err;
    std::shared_ptr<CDataFactory> factory;
    std::shared_ptr<CTransportationPlanner> planner;

    std::vector<CTransportationPlanner::TTripStep> lastpath;
    CTransportationPlanner::TNodeID lastsrc = CStreetMap::InvalidNodeID;
    CTransportationPlanner::TNodeID lastdst = CStreetMap::InvalidNodeID;
    double lasthours = CPathRouter::NoPathExists;
    bool haspath = false;

    SImplementation(std::shared_ptr<CDataSource> csrc, std::shared_ptr<CDataSink> cout, std::shared_ptr<CDataSink> cerrs, std::shared_ptr<CDataFactory> cfactory, std::shared_ptr<CTransportationPlanner> cplanner){
        src = csrc;
        out = cout;
        err = cerrs;
        factory = cfactory;
        planner = cplanner;
    }

    static bool ParseU64(const std::string &s, uint64_t &v){
        if(s.empty()){
            return false;
        }
        uint64_t x = 0;
        for(char c : s){
            if(c < '0' || c > '9'){
                return false;
            }
            x = x * 10 + static_cast<uint64_t>(c - '0');
        }
        v = x;
        return true;
    }

    static std::string ModeName(CTransportationPlanner::ETransportationMode m){
        if(m == CTransportationPlanner::ETransportationMode::Walk){
            return "Walk";
        }
        if(m == CTransportationPlanner::ETransportationMode::Bike){
            return "Bike";
        }
        return "Bus";
    }

    static std::string TimeString(double h){
        long long t = static_cast<long long>(std::llround(h * 3600.0));
        long long hr = t / 3600;
        long long mn = (t % 3600) / 60;
        long long sc = t % 60;
        std::ostringstream s;
        bool first = true;
        if(hr > 0){
            s << hr << " hr";
            first = false;
        }
        if(mn > 0){
            if(!first){
                s << " ";
            }
            s << mn << " min";
            first = false;
        }
        if(sc > 0 || first){
            if(!first){
                s << " ";
            }
            s << sc << " sec";
        }
        return s.str();
    }

    void Put(std::shared_ptr<CDataSink> sink, const std::string &s){
        sink->Write(std::vector<char>(s.begin(), s.end()));
    }

    bool ReadLine(std::string &line){
        line.clear();
        while(true){
            char c;
            if(!src->Get(c)){
                return !line.empty();
            }
            if(c == '\n'){
                return true;
            }
            if(c != '\r'){
                line.push_back(c);
            }
        }
    }

    void SaveShortest(const std::vector<CTransportationPlanner::TNodeID> &nodes, CTransportationPlanner::TNodeID s, CTransportationPlanner::TNodeID d, double h){
        lastpath.clear();
        for(auto n : nodes){
            lastpath.push_back(std::make_pair(CTransportationPlanner::ETransportationMode::Walk, n));
        }
        lastsrc = s;
        lastdst = d;
        lasthours = h;
        haspath = !lastpath.empty();
    }

    void SaveFastest(const std::vector<CTransportationPlanner::TTripStep> &nodes, CTransportationPlanner::TNodeID s, CTransportationPlanner::TNodeID d, double h){
        lastpath = nodes;
        lastsrc = s;
        lastdst = d;
        lasthours = h;
        haspath = !lastpath.empty();
    }

    bool Process(){
        while(true){
            Put(out, "> ");
            std::string line;
            if(!ReadLine(line)){
                return true;
            }
            auto parts = StringUtils::Split(line);
            if(parts.empty()){
                continue;
            }
            auto cmd = parts[0];

            if(cmd == "exit"){
                return true;
            }
            else if(cmd == "help"){
                Put(out, "------------------------------------------------------------------------\n"
                         "help     Display this help menu\n"
                         "exit     Exit the program\n"
                         "count    Output the number of nodes in the map\n"
                         "node     Syntax \"node [0, count)\" \n"
                         "         Will output node ID and Lat/Lon for node\n"
                         "fastest  Syntax \"fastest start end\" \n"
                         "         Calculates the time for fastest path from start to end\n"
                         "shortest Syntax \"shortest start end\" \n"
                         "         Calculates the distance for the shortest path from start to end\n"
                         "save     Saves the last calculated path to file\n"
                         "print    Prints the steps for the last calculated path\n");
            }
            else if(cmd == "count"){
                Put(out, std::to_string(planner->NodeCount()) + " nodes\n");
            }
            else if(cmd == "node"){
                if(parts.size() != 2){
                    Put(err, "Invalid node command, see help.\n");
                    continue;
                }
                uint64_t idx = 0;
                if(!ParseU64(parts[1], idx)){
                    Put(err, "Invalid node parameter, see help.\n");
                    continue;
                }
                if(idx >= planner->NodeCount()){
                    Put(err, "Invalid node parameter, see help.\n");
                    continue;
                }
                auto n = planner->SortedNodeByIndex(idx);
                if(!n){
                    Put(err, "Invalid node parameter, see help.\n");
                    continue;
                }
                Put(out, "Node " + std::to_string(idx) + ": id = " + std::to_string(n->ID()) + " is at " + SGeographicUtils::ConvertLLToDMS(n->Location()) + "\n");
            }
            else if(cmd == "shortest"){
                if(parts.size() != 3){
                    Put(err, "Invalid shortest command, see help.\n");
                    continue;
                }
                uint64_t a = 0;
                uint64_t b = 0;
                if(!ParseU64(parts[1], a) || !ParseU64(parts[2], b)){
                    Put(err, "Invalid shortest parameter, see help.\n");
                    continue;
                }
                std::vector<CTransportationPlanner::TNodeID> p;
                double d = planner->FindShortestPath(a, b, p);
                if(d == CPathRouter::NoPathExists){
                    Put(out, "No path found.\n");
                    haspath = false;
                    continue;
                }
                SaveShortest(p, a, b, d);
                std::ostringstream s;
                s << d;
                Put(out, "Shortest path is " + s.str() + " mi.\n");
            }
            else if(cmd == "fastest"){
                if(parts.size() != 3){
                    Put(err, "Invalid fastest command, see help.\n");
                    continue;
                }
                uint64_t a = 0;
                uint64_t b = 0;
                if(!ParseU64(parts[1], a) || !ParseU64(parts[2], b)){
                    Put(err, "Invalid fastest parameter, see help.\n");
                    continue;
                }
                std::vector<CTransportationPlanner::TTripStep> p;
                double t = planner->FindFastestPath(a, b, p);
                if(t == CPathRouter::NoPathExists){
                    Put(out, "No path found.\n");
                    haspath = false;
                    continue;
                }
                SaveFastest(p, a, b, t);
                Put(out, "Fastest path takes " + TimeString(t) + ".\n");
            }
            else if(cmd == "save"){
                if(!haspath){
                    Put(err, "No valid path to save, see help.\n");
                    continue;
                }
                std::string file = std::to_string(lastsrc) + "_" + std::to_string(lastdst) + "_" + std::to_string(lasthours) + "hr.csv";
                auto sink = factory->CreateSink(file);
                if(!sink){
                    Put(err, "No valid path to save, see help.\n");
                    continue;
                }
                Put(sink, "mode,node_id\n");
                for(std::size_t i = 0; i < lastpath.size(); i++){
                    std::string row = ModeName(lastpath[i].first) + "," + std::to_string(lastpath[i].second);
                    if(i + 1 < lastpath.size()){
                        row += "\n";
                    }
                    Put(sink, row);
                }
                Put(out, "Path saved to <results>/" + file + "\n");
            }
            else if(cmd == "print"){
                if(!haspath){
                    Put(err, "No valid path to print, see help.\n");
                    continue;
                }
                std::vector<std::string> text;
                if(!planner->GetPathDescription(lastpath, text)){
                    Put(err, "No valid path to print, see help.\n");
                    continue;
                }
                for(const auto &s : text){
                    Put(out, s + "\n");
                }
            }
            else{
                Put(err, "Unknown command \"" + cmd + "\" type help for help.\n");
            }
        }
    }
};

CTransportationPlannerCommandLine::CTransportationPlannerCommandLine(std::shared_ptr<CDataSource> cmdsrc, std::shared_ptr<CDataSink> outsink, std::shared_ptr<CDataSink> errsink, std::shared_ptr<CDataFactory> results, std::shared_ptr<CTransportationPlanner> planner){
    DImplementation = std::make_unique<SImplementation>(cmdsrc, outsink, errsink, results, planner);
}

CTransportationPlannerCommandLine::~CTransportationPlannerCommandLine() = default;

bool CTransportationPlannerCommandLine::ProcessCommands(){
    return DImplementation->Process();
}
