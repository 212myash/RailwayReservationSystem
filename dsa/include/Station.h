
#ifndef STATION_H
#define STATION_H

#include <string>

using namespace std;

class Station {
private:
    string code;
    string name;
    string city;
    string state;

public:
    Station();

    Station(
        string stationCode,
        string stationName,
        string stationCity,
        string stationState
    );

    string getCode() const;
    string getName() const;
    string getCity() const;
    string getState() const;

    void display() const;
};

#endif
