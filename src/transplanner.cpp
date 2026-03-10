#include "TransportationPlannerConfig.h"
#include "DijkstraTransportationPlanner.h"
#include "TransportationPlannerCommandLine.h"
#include "OpenStreetMap.h"
#include "CSVBusSystem.h"
#include "FileDataFactory.h"
#include "StandardDataSource.h"
#include "StandardDataSink.h"
#include "StandardErrorDataSink.h"
#include "StringUtils.h"

#include <iostream>
#include <string>
#include <vector>

class CArgs{
    private:
        std::string data;
        std::string results;
        bool ok;

        void PrintSyntax() const{
            std::cerr << "Syntax Error: transplanner [--data=path | --results=path]" << std::endl;
        }

    public:
        CArgs(const std::vector<std::string> &args){
            data = "./data";
            results = "./results";
            ok = true;
            // checking command line flags
            for(const auto &a : args){
                if(a.find("--data") == 0){
                    auto p = StringUtils::Split(a, "=");
                    if(p.size() != 2 || p[0] != "--data"){
                        ok = false;
                        break;
                    }
                    data = p[1];
                }
                else if(a.find("--results") == 0){
                    auto p = StringUtils::Split(a, "=");
                    if(p.size() != 2 || p[0] != "--results"){
                        ok = false;
                        break;
                    }
                    results = p[1];
                }
                else{
                    ok = false;
                    break;
                }
            }
            if(!ok){
                PrintSyntax();
            }
        }

        bool Valid() const{
            return ok;
        }

        std::string DataDir() const{
            return data;
        }

        std::string ResultsDir() const{
            return results;
        }
};

int main(int argc, char *argv[]){
    std::vector<std::string> args;
    // grabbing args except program name
    for(int i = 1; i < argc; i++){
        args.push_back(argv[i]);
    }

    CArgs parser(args);
    if(!parser.Valid()){
        return EXIT_FAILURE;
    }

    auto datafactory = std::make_shared<CFileDataFactory>(parser.DataDir());
    auto resultsfactory = std::make_shared<CFileDataFactory>(parser.ResultsDir());

    auto xml = std::make_shared<CXMLReader>(datafactory->CreateSource("city.osm"));
    auto stopcsv = std::make_shared<CDSVReader>(datafactory->CreateSource("stops.csv"), ',');
    auto routecsv = std::make_shared<CDSVReader>(datafactory->CreateSource("routes.csv"), ',');

    auto map = std::make_shared<COpenStreetMap>(xml);
    auto bus = std::make_shared<CCSVBusSystem>(stopcsv, routecsv);
    auto cfg = std::make_shared<STransportationPlannerConfig>(map, bus);
    auto planner = std::make_shared<CDijkstraTransportationPlanner>(cfg);

    auto in = std::make_shared<CStandardDataSource>();
    auto out = std::make_shared<CStandardDataSink>();
    auto err = std::make_shared<CStandardErrorDataSink>();

    // hand everything to the command line wrapper
    CTransportationPlannerCommandLine cli(in, out, err, resultsfactory, planner);
    if(!cli.ProcessCommands()){
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
