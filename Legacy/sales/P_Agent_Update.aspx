<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="P_Agent_Update.aspx.vb" Inherits="Default2" %>

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
            <table style="width: 100%" align="center">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="2">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="RECEIPT AGENT UPDATE"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 580px">
                                        &nbsp;</td>
                                    <td style="width: 154px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Receipt No"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadTextBox ID="txtsearch" Runat="server" Width="250px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel34" runat="server" Height="100%" ScrollBars="Both" 
                            Width="1120px">
                            <telerik:RadGrid ID="GDSEARCH_1" runat="server" AllowPaging="True" 
                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                <MasterTableView AutoGenerateColumns="False" DataKeyNames="ID">
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
                                        
                                        <telerik:GridBoundColumn DataField="Prem_Receipt_no" 
                                            FilterControlAltText="Filter Prem_Receipt_no column" HeaderText="Prem_Receipt_no" 
                                            SortExpression="Prem_Receipt_no" UniqueName="Prem_Receipt_no">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Proposer_Display_Name" 
                                            FilterControlAltText="Filter Proposer_Display_Name column" HeaderText="Proposer_Display_Name" 
                                            SortExpression="Proposer_Display_Name" UniqueName="Proposer_Display_Name">
                                        </telerik:GridBoundColumn>
                                        <telerik:GridBoundColumn DataField="Prem_Receipt_Date" 
                                            FilterControlAltText="Filter Prem_Receipt_Date column" HeaderText="Prem_Receipt_Date" 
                                            ItemStyle-Wrap="False" SortExpression="Prem_Receipt_Date" UniqueName="Prem_Receipt_Date">
                                        </telerik:GridBoundColumn>
                                      
                                        <telerik:GridBoundColumn DataField="Rec_Amount" 
                                            FilterControlAltText="Filter Rec_Amount column" HeaderText="Amount" 
                                            SortExpression="Rec_Amount" UniqueName="Rec_Amount">
                                        </telerik:GridBoundColumn>
                                         <telerik:GridBoundColumn DataField="User_display_name" 
                                            FilterControlAltText="Filter User_display_name column" HeaderText="Agent" 
                                            SortExpression="User_display_name" UniqueName="User_display_name">
                                        </telerik:GridBoundColumn>
                                          <telerik:GridBoundColumn DataField="Agents_Updated" 
                                            FilterControlAltText="Filter Agents_Updated column" HeaderText="Agents_Updated" 
                                            SortExpression="Agents_Updated" UniqueName="Agents_Updated">
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
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        <asp:Panel ID="Panel4" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1120px">
                            <table style="width: 100%">
                                <tr>
                                    <td bgcolor="#666666" colspan="4" style="height: 13px">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8">
                                        <asp:Label ID="lblRec" runat="server" Font-Bold="True" Font-Size="Small" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        <asp:Label ID="lbLID" runat="server" Font-Bold="True" Font-Size="Small" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label51" runat="server" Text="Agent" style="font-weight: 700"></asp:Label>
                                    </td>
                                    <td class="style8">
                                        <telerik:RadComboBox ID="cbostatus" Runat="server" AutoPostBack="True" 
                                            Skin="Simple" Width="300px" AllowCustomText="True" MarkFirstMatch="True">
                                        </telerik:RadComboBox>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        <asp:Label ID="Label74" runat="server" style="font-weight: 700" Text="Comment"></asp:Label>
                                    </td>
                                    <td class="style8" rowspan="2">
                                        <telerik:RadTextBox ID="txtcomm" Runat="server" Height="70px" Rows="1" 
                                            Skin="Sunset" TextMode="MultiLine" Width="450px">
                                        </telerik:RadTextBox>
                                    </td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 17px; width: 126px;">
                                        &nbsp;</td>
                                    <td style="width: 129px; height: 17px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 17px;">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td class="style8" style="height: 16px; width: 126px;">
                                        &nbsp;</td>
                                    <td class="style8" style="width: 338px; height: 16px;">
                                        <telerik:RadButton ID="btnupload" runat="server" Skin="Simple" Text="Update">
                                        </telerik:RadButton>
                                        <asp:Label ID="lblupload" runat="server" Font-Bold="True" Font-Size="Medium" 
                                            ForeColor="Red"></asp:Label>
                                    </td>
                                    <td style="width: 129px; height: 16px;">
                                        &nbsp;</td>
                                    <td style="width: 287px; height: 16px;">
                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                    </td>
                                </tr>
                                <tr>
                                    <td class="style8" colspan="4">
                                        <asp:Panel ID="Panel36" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="1120px">
                                            <telerik:RadGrid ID="GDSEARCH_2" runat="server" AllowPaging="True" 
                                                CellSpacing="0" GridLines="None" Height="100%" Skin="WebBlue" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False" >
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                        <HeaderStyle Width="20px" />
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                        <HeaderStyle Width="20px" />
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                   
                                                        <telerik:GridBoundColumn DataField="Prem_Receipt_no" 
                                                            FilterControlAltText="Filter Prem_Receipt_no column" 
                                                            HeaderText="Prem_Receipt_no" SortExpression="Prem_Receipt_no" 
                                                            UniqueName="Prem_Receipt_no">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                            FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                            SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Prem_Receipt_Date" 
                                                            FilterControlAltText="Filter Prem_Receipt_Date column" 
                                                            HeaderText="Prem_Receipt_Date" ItemStyle-Wrap="False" 
                                                            SortExpression="Prem_Receipt_Date" UniqueName="Prem_Receipt_Date">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Receipt_Amount" 
                                                            FilterControlAltText="Filter Receipt_Amount column" HeaderText="Amount" 
                                                            SortExpression="Receipt_Amount" UniqueName="Receipt_Amount">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="User_display_name" 
                                                            FilterControlAltText="Filter User_display_name column" HeaderText="Agent" 
                                                            SortExpression="User_display_name" UniqueName="User_display_name">
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="COMMISSION" 
                                                            FilterControlAltText="Filter COMMISSION column" HeaderText="Commission" 
                                                            SortExpression="COMMISSION" UniqueName="COMMISSION">
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
                                    <td class="style8" colspan="4" style="height: 16px; ">
                                        <asp:Panel ID="Panel15" runat="server" Height="100%" ScrollBars="Both" 
                                            Width="98%">
                                            <telerik:RadGrid ID="GDNOTES" runat="server" AllowPaging="True" CellSpacing="0" 
                                                GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                <MasterTableView AutoGenerateColumns="False">
                                                    <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                    <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                    </RowIndicatorColumn>
                                                    <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                    </ExpandCollapseColumn>
                                                    <Columns>
                                                        <telerik:GridBoundColumn DataField="Note_date" 
                                                            FilterControlAltText="Filter Note_date column" HeaderText="Note date" 
                                                            ItemStyle-Width="100" SortExpression="Note_date" UniqueName="Note_date">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Ref_No" 
                                                            FilterControlAltText="Filter Ref_No column" HeaderText="Ref_No" 
                                                            ItemStyle-Width="50" SortExpression="Ref_No" UniqueName="Ref_No">
                                                            <ItemStyle Width="50px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Note_From" 
                                                            FilterControlAltText="Filter Note_From column" HeaderText="From" 
                                                            ItemStyle-Width="100" SortExpression="Note_From" UniqueName="Note_From">
                                                            <ItemStyle Width="100px" />
                                                        </telerik:GridBoundColumn>
                                                        <telerik:GridBoundColumn DataField="Notes" 
                                                            FilterControlAltText="Filter Notes column" HeaderText="Notes" 
                                                            SortExpression="Notes" UniqueName="Notes">
                                                        </telerik:GridBoundColumn>
                                                    </Columns>
                                                    <EditFormSettings>
                                                        <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                        </EditColumn>
                                                    </EditFormSettings>
                                                </MasterTableView>
                                                <ItemStyle Wrap="False" />
                                                <FilterMenu EnableImageSprites="False">
                                                </FilterMenu>
                                                <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                </HeaderContextMenu>
                                            </telerik:RadGrid>
                                        </asp:Panel>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
        
    </asp:UpdatePanel>
</asp:Content>




