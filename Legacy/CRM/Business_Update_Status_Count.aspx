<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_Update_Status_Count.aspx.vb" Inherits="_Default" %>
<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="4">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="BPO PERFORMANCE"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3" align="center">
                        <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Height="100%" style="font-weight: 700" Width="1150px">
                            <table style="width: 99%">
                                <tr>
                                    <td class="style8">
                                        <table style="width: 100%">
                                            <tr>
                                                <td style="width: 737px">
                                                    <asp:Label ID="Label7" runat="server" style="font-weight: 700" 
                                                        Text="BUSINESS UPDATE SUMMARY"></asp:Label>
                                                </td>
                                                <td style="width: 92px">
                                                    &nbsp;</td>
                                                <td>
                                                    &nbsp;</td>
                                            </tr>
                                        </table>
                                        <table style="width: 100%">
                                            <tr>
                                                <td>
                                                    <asp:Panel ID="Panel25" runat="server" Height="100%" ScrollBars="Both" 
                                                        Width="99%">
                                                        <telerik:RadGrid ID="GD_M_M" runat="server" AllowPaging="True" CellSpacing="0" 
                                                            GridLines="None" Height="100%" PageSize="50" Skin="Web20" Width="100%">
                                                            <MasterTableView AutoGenerateColumns="False">
                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                    <HeaderStyle Width="20px" />
                                                                </RowIndicatorColumn>
                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                    <HeaderStyle Width="20px" />
                                                                </ExpandCollapseColumn>
                                                                <Columns>
                                                                    <telerik:GridBoundColumn DataField="Business_Type" 
                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Business_Type" 
                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Total_Registered" 
                                                                        FilterControlAltText="Filter Total_Registered column" HeaderText="Registered" 
                                                                        SortExpression="Total_Registered" UniqueName="Total_Registered">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Not_Forwarded" 
                                                                        FilterControlAltText="Filter Not_Forwarded column" HeaderText="Not_Forwarded" 
                                                                        SortExpression="Not_Forwarded" UniqueName="Not_Forwarded">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Returned_NotForwarded" 
                                                                        FilterControlAltText="Filter Returned_NotForwarded column" 
                                                                        HeaderText="Returned_NotForwarded" SortExpression="Returned_NotForwarded" 
                                                                        UniqueName="Returned_NotForwarded">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Not_Allocated" 
                                                                        FilterControlAltText="Filter Not_Allocated column" HeaderText="Not_Allocated" 
                                                                        SortExpression="Not_Allocated" UniqueName="Not_Allocated">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Medical_UW" 
                                                                        FilterControlAltText="Filter Medical_UW column" HeaderText="Medical_UW" 
                                                                        SortExpression="Medical_UW" UniqueName="Medical_UW">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Declined" 
                                                                        FilterControlAltText="Filter Declined column" HeaderText="Declined" 
                                                                        SortExpression="Declined" UniqueName="Declined">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Pricing" 
                                                                        FilterControlAltText="Filter Pricing column" HeaderText="Pricing" 
                                                                        SortExpression="Pricing" UniqueName="Pricing">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Waiting_Update" 
                                                                        FilterControlAltText="Filter Waiting_Update column" HeaderText="Waiting_Update" 
                                                                        SortExpression="Waiting_Update" UniqueName="Waiting_Update">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Waiting_Payment" 
                                                                        FilterControlAltText="Filter Waiting_Payment column" 
                                                                        HeaderText="Waiting_Payment" SortExpression="Waiting_Payment" 
                                                                        UniqueName="Waiting_Payment">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Not_Receipted" 
                                                                        FilterControlAltText="Filter Not_Receipted column" HeaderText="Not_Receipted" 
                                                                        SortExpression="Not_Receipted" UniqueName="Not_Receipted">
                                                                    </telerik:GridBoundColumn>
                                                                    <telerik:GridBoundColumn DataField="Receipted" 
                                                                        FilterControlAltText="Filter Receipted column" HeaderText="Receipted" 
                                                                        SortExpression="Receipted" UniqueName="Receipted">
                                                                    </telerik:GridBoundColumn>
                                                                </Columns>
                                                                <EditFormSettings>
                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                    </EditColumn>
                                                                </EditFormSettings>
                                                            </MasterTableView>
                                                            <FilterMenu EnableImageSprites="False">
                                                            </FilterMenu>
                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                            </HeaderContextMenu>
                                                        </telerik:RadGrid>
                                                    </asp:Panel>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8">
                                        <asp:Panel ID="Panel23" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="99%">
                                            <telerik:RadGrid ID="GD_M_1" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" PageSize="50" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Allocated_to">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="Allocated_to" 
                                                            FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                            SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Total_Registered" 
                                                            FilterControlAltText="Filter Total_Registered column" 
                                                            HeaderText="Total_Allocated" SortExpression="Total_Registered" 
                                                            UniqueName="Total_Registered">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Forwarded" 
                                                            FilterControlAltText="Filter Not_Forwarded column" HeaderText="Not_Forwarded" 
                                                            SortExpression="Not_Forwarded" UniqueName="Not_Forwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Returned_NotForwarded" 
                                                            FilterControlAltText="Filter Returned_NotForwarded column" 
                                                            HeaderText="Returned_NotForwarded" SortExpression="Returned_NotForwarded" 
                                                            UniqueName="Returned_NotForwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Allocated" 
                                                            FilterControlAltText="Filter Not_Allocated column" HeaderText="Not_Allocated" 
                                                            SortExpression="Not_Allocated" UniqueName="Not_Allocated">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Medical_UW" 
                                                            FilterControlAltText="Filter Medical_UW column" HeaderText="Medical_UW" 
                                                            SortExpression="Medical_UW" UniqueName="Medical_UW">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Declined" 
                                                            FilterControlAltText="Filter Declined column" HeaderText="Declined" 
                                                            SortExpression="Declined" UniqueName="Declined">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Pricing" 
                                                            FilterControlAltText="Filter Pricing column" HeaderText="Pricing" 
                                                            SortExpression="Pricing" UniqueName="Pricing">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Update" 
                                                            FilterControlAltText="Filter Waiting_Update column" HeaderText="Waiting_Update" 
                                                            SortExpression="Waiting_Update" UniqueName="Waiting_Update">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Payment" 
                                                            FilterControlAltText="Filter Waiting_Payment column" 
                                                            HeaderText="Waiting_Payment" SortExpression="Waiting_Payment" 
                                                            UniqueName="Waiting_Payment">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Receipted" 
                                                            FilterControlAltText="Filter Not_Receipted column" HeaderText="Not_Receipted" 
                                                            SortExpression="Not_Receipted" UniqueName="Not_Receipted">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Receipted" 
                                                            FilterControlAltText="Filter Receipted column" HeaderText="Receipted" 
                                                            SortExpression="Receipted" UniqueName="Receipted">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8">
                                        <asp:Label ID="Label1" runat="server" style="font-weight: 700" Text="PER MONTH"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8">
                                        <asp:Panel ID="Panel26" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="99%">
                                            <telerik:RadGrid ID="GDRM_2" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" PageSize="50" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="Entry_Mon">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridButtonColumn CommandName="Select" 
                                                            FilterControlAltText="Filter ID column" HeaderText="Select" Text="Select" 
                                                            UniqueName="Select">
                                                            <HeaderStyle ForeColor="Blue" Width="50px" />
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridButtonColumn>
                                                        <telerik:GridBoundColumn DataField="Entry_Mon" 
                                                            FilterControlAltText="Filter Entry_Mon column" HeaderText="Entry_Mon" 
                                                            SortExpression="Entry_Mon" UniqueName="Entry_Mon">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Total_Registered" 
                                                            FilterControlAltText="Filter Total_Registered column" 
                                                            HeaderText="Total_Allocated" SortExpression="Total_Registered" 
                                                            UniqueName="Total_Registered">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Forwarded" 
                                                            FilterControlAltText="Filter Not_Forwarded column" HeaderText="Not_Forwarded" 
                                                            SortExpression="Not_Forwarded" UniqueName="Not_Forwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Returned_NotForwarded" 
                                                            FilterControlAltText="Filter Returned_NotForwarded column" 
                                                            HeaderText="Returned_NotForwarded" SortExpression="Returned_NotForwarded" 
                                                            UniqueName="Returned_NotForwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Allocated" 
                                                            FilterControlAltText="Filter Not_Allocated column" HeaderText="Not_Allocated" 
                                                            SortExpression="Not_Allocated" UniqueName="Not_Allocated">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Medical_UW" 
                                                            FilterControlAltText="Filter Medical_UW column" HeaderText="Medical_UW" 
                                                            SortExpression="Medical_UW" UniqueName="Medical_UW">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Declined" 
                                                            FilterControlAltText="Filter Declined column" HeaderText="Declined" 
                                                            SortExpression="Declined" UniqueName="Declined">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Pricing" 
                                                            FilterControlAltText="Filter Pricing column" HeaderText="Pricing" 
                                                            SortExpression="Pricing" UniqueName="Pricing">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Update" 
                                                            FilterControlAltText="Filter Waiting_Update column" HeaderText="Waiting_Update" 
                                                            SortExpression="Waiting_Update" UniqueName="Waiting_Update">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Payment" 
                                                            FilterControlAltText="Filter Waiting_Payment column" 
                                                            HeaderText="Waiting_Payment" SortExpression="Waiting_Payment" 
                                                            UniqueName="Waiting_Payment">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Receipted" 
                                                            FilterControlAltText="Filter Not_Receipted column" HeaderText="Not_Receipted" 
                                                            SortExpression="Not_Receipted" UniqueName="Not_Receipted">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Receipted" 
                                                            FilterControlAltText="Filter Receipted column" HeaderText="Receipted" 
                                                            SortExpression="Receipted" UniqueName="Receipted">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8">
                                        <asp:Panel ID="Panel24" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="99%">
                                            <telerik:RadGrid ID="GDRM_1" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" PageSize="50" Skin="Web20" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Business_Type" 
                                                            FilterControlAltText="Filter Business_Type column" HeaderText="Business_Type" 
                                                            SortExpression="Business_Type" UniqueName="Business_Type">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Total_Registered" 
                                                            FilterControlAltText="Filter Total_Registered column" 
                                                            HeaderText="Total_Allocated" SortExpression="Total_Registered" 
                                                            UniqueName="Total_Registered">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Forwarded" 
                                                            FilterControlAltText="Filter Not_Forwarded column" HeaderText="Not_Forwarded" 
                                                            SortExpression="Not_Forwarded" UniqueName="Not_Forwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Returned_NotForwarded" 
                                                            FilterControlAltText="Filter Returned_NotForwarded column" 
                                                            HeaderText="Returned_NotForwarded" SortExpression="Returned_NotForwarded" 
                                                            UniqueName="Returned_NotForwarded">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Allocated" 
                                                            FilterControlAltText="Filter Not_Allocated column" HeaderText="Not_Allocated" 
                                                            SortExpression="Not_Allocated" UniqueName="Not_Allocated">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Medical_UW" 
                                                            FilterControlAltText="Filter Medical_UW column" HeaderText="Medical_UW" 
                                                            SortExpression="Medical_UW" UniqueName="Medical_UW">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Declined" 
                                                            FilterControlAltText="Filter Declined column" HeaderText="Declined" 
                                                            SortExpression="Declined" UniqueName="Declined">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Pricing" 
                                                            FilterControlAltText="Filter Pricing column" HeaderText="Pricing" 
                                                            SortExpression="Pricing" UniqueName="Pricing">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Update" 
                                                            FilterControlAltText="Filter Waiting_Update column" HeaderText="Waiting_Update" 
                                                            SortExpression="Waiting_Update" UniqueName="Waiting_Update">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Waiting_Payment" 
                                                            FilterControlAltText="Filter Waiting_Payment column" 
                                                            HeaderText="Waiting_Payment" SortExpression="Waiting_Payment" 
                                                            UniqueName="Waiting_Payment">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Not_Receipted" 
                                                            FilterControlAltText="Filter Not_Receipted column" HeaderText="Not_Receipted" 
                                                            SortExpression="Not_Receipted" UniqueName="Not_Receipted">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Receipted" 
                                                            FilterControlAltText="Filter Receipted column" HeaderText="Receipted" 
                                                            SortExpression="Receipted" UniqueName="Receipted">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8">
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                        <asp:HiddenField ID="HiddenField2" runat="server" />
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 105px">
                        <asp:Label ID="lblerr" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                    </td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
   
    </asp:UpdatePanel>
</asp:Content>

