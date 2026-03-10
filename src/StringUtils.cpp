#include "StringUtils.h"

namespace StringUtils{

std::string Slice(const std::string &str, ssize_t start, ssize_t end) noexcept{
    
    int length = str.size();

    if(end == 0){
        end = length;
    }

    if(start < 0){
        start = length + start;
    }

    if(end < 0){
        end = length + end;
    }

    if (start < 0){
        start = 0;
    }

    if (end < 0){
        end = 0;
    }

    if (start > length){
        start = length;
    }

    if (end > length){
        end = length;
    }


    if(start > length && end > length){
        return "";
    }


    if(start >= end){
        return "";
    }
    
    return str.substr(start, end - start);
}

std::string Capitalize(const std::string &str) noexcept{

    std::string Temp = str;

    if(!Temp.empty()){
        Temp[0] = toupper(Temp[0]);
        for(size_t Index = 1; Index < Temp.length(); Index++){
            Temp[Index] = tolower(Temp[Index]);
        }
    }

    return Temp;
    
}

std::string Upper(const std::string &str) noexcept{

    std::string Temp = str;

    if(!Temp.empty()){
        for(size_t Index = 0; Index < Temp.length(); Index++){
            Temp[Index] = toupper(Temp[Index]);
        }
    }

    return Temp;
}

std::string Lower(const std::string &str) noexcept{

    std::string Temp = str;

    if(!Temp.empty()){
        for(size_t Index = 0; Index < Temp.length(); Index++){
            Temp[Index] = tolower(Temp[Index]);
        }
    }

    return Temp;
}

std::string LStrip(const std::string &str) noexcept{
    std::string Temp = str;
    size_t Index = 0;
    size_t Length = Temp.length();
    while((Index < Length) && isspace(Temp[Index])){
        Index++;
    }

    return Temp.substr(Index);
}

std::string RStrip(const std::string &str) noexcept{
    std::string Temp = str;
    if(!Temp.empty()){
        size_t Index = Temp.length()-1;
        while(isspace(Temp[Index])){
            if(!Index){
                return "";
            }
            Index--;
        }
        return Temp.substr(0,Index+1);
    }
    return "";
}

std::string Strip(const std::string &str) noexcept{

    return LStrip(RStrip(str));
}

std::string Center(const std::string &str, int width, char fill) noexcept{
    
        if (width <= str.length()) {
            return str;
        }
    
        int total = width - str.length();
        int left  = total / 2;
        
    
        std::string Temp = RJust(str, str.length() + left, fill);
        return LJust(Temp, width, fill);
    }

std::string LJust(const std::string &str, int width, char fill) noexcept{

    if (width <= str.length()) {
        return str;
    }

    std::string Temp = str;
    int num = width - str.length();

    for (int i = 0; i < num; i++) {
        Temp += fill;   
    }

    return Temp;

}

std::string RJust(const std::string &str, int width, char fill) noexcept{

        if (width <= str.length()) {
            return str;
        }
    
        std::string Temp = "";
        int num = width - str.length();
    
        
        for (int i = 0; i < num; i++) {
            Temp += fill;
        }
    
        Temp += str;
        return Temp;
    }

std::string Replace(const std::string &str, const std::string &old, const std::string &rep) noexcept{

    if (old.empty()) {
        return str;
    }

    std::string Temp = "";
    int i = 0;

    while (i < str.length()) {
        
        if (str.substr(i, old.length()) == old) {
            Temp += rep;
            i += old.length();   
        } 
        else {
            Temp += str[i];
            i++;                 
        }
    }

    return Temp;
}

std::vector< std::string > Split(const std::string &str, const std::string &splt) noexcept{
    
    std::vector< std::string > Temp = {};
    
    if (splt.empty()) {
        int start = 0;
        int end = 0;
    
        while (end < str.length()) {
            while (end < str.length() && isspace(str[end])) {
                end++;
            }

            start = end;
    
            while (end < str.length() && !isspace(str[end])) {
                end++;
            }
    
            if (start < end) {
                Temp.insert(Temp.end(), str.substr(start, end - start));
            }
        }
    }
    else {
        int start = 0;
        int end = 0;
        int num = splt.length();
    
        while (true) {
            end = str.find(splt, start);
        
            
            if (end >= str.length()) {
                break;
            }
        
            Temp.insert(Temp.end(), str.substr(start, end - start));
            start = end + num;
        }

        Temp.insert(Temp.end(), str.substr(start));
    }
    
    return Temp;
    
    

}

std::string Join(const std::string &str, const std::vector< std::string > &vect) noexcept{

    if (vect.empty()) {
        return "";
    }
    
    std::string Temp = vect[0];
    
    for (int i = 1; i < vect.size(); i++) {
        Temp += str;
        Temp += vect[i];
    }
    
    return Temp;
}

std::string ExpandTabs(const std::string &str, int tabsize) noexcept{

    std::string Temp = "";
    int col = 0;   

    for (int i = 0; i < str.length(); i++) {
        char c = str[i];
        
        if (c == '\t') {
            int num = tabsize - (col % tabsize);
            for (int j = 0; j < num; j++) {
                Temp += ' ';
                col++;
            }
        }
        else if (c == '\n') {
            Temp += c;
            col = 0;
        }
        else {
            Temp += c;
            col++;
        }
    }

    return Temp;
}

int EditDistance(const std::string &left, const std::string &right, bool ignorecase) noexcept{
   
std::string a = left;
std::string b = right;

if (ignorecase) {
    a = Lower(a);
    b = Lower(b);
}

int x = a.length();
int y = b.length();


std::vector<std::vector<int>> arr(x + 1, std::vector<int>(y + 1, 0));

for (int i = 0; i <= x; i++) {
    arr[i][0] = i;   
}
for (int j = 0; j <= y; j++) {
    arr[0][j] = j;   
}

for (int i = 1; i <= x; i++) {
    for (int j = 1; j <= y; j++) {
        if (a[i - 1] == b[j - 1]) {
            arr[i][j] = arr[i - 1][j - 1]; 
        } else {
            int num1  = arr[i][j - 1] + 1; 
            int num2  = arr[i - 1][j] + 1; 
            int num3 = arr[i - 1][j - 1] + 1; 

            int best = num1;

            if (num2 < best) {
                best = num2;
            }

            if (num3 < best) {
                best = num3;
            }

            arr[i][j] = best;
        }
    }
}

return arr[x][y];
}

};