
#ifndef BOOKING_HISTORY_H
#define BOOKING_HISTORY_H

#include "Booking.h"
#include <string>

class BookingHistory {
private:
    struct Node {
        Booking booking;
        Node* next;

        explicit Node(const Booking& b)
            : booking(b), next(nullptr) {}
    };

    Node* head;
    int count;

public:
    BookingHistory();
    ~BookingHistory();

    BookingHistory(const BookingHistory&) = delete;
    BookingHistory& operator=(const BookingHistory&) = delete;

    void addBooking(const Booking& booking);
    void displayHistory() const;

    bool searchByPNR(const std::string& pnr) const;

    // Delete a booking by PNR.
    bool deleteByPNR(const std::string& pnr);

    bool isEmpty() const;
    int getSize() const;
    void clear();
};

#endif
